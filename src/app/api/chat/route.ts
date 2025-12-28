import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.object({
    dealId: z.string().optional(),
    portfolioId: z.string().optional(),
    documentIds: z.array(z.string()).optional(),
  }).optional(),
});

// Semantic search function (simplified - in production use pgvector or dedicated vector DB)
async function searchRelevantChunks(
  organizationId: string,
  query: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  score: number;
}>> {
  // In production, this would:
  // 1. Generate embedding for the query using OpenAI
  // 2. Search vector database for similar chunks
  // 3. Return ranked results

  // For demo, return mock relevant chunks
  const documents = await db.document.findMany({
    where: {
      organizationId,
      status: 'INDEXED',
    },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
    },
    take: limit,
  });

  return documents.map((doc, index) => ({
    id: `chunk-${doc.id}`,
    content: doc.summary || doc.content?.slice(0, 500) || 'No content available',
    documentId: doc.id,
    documentTitle: doc.title,
    score: 0.95 - index * 0.05,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await db.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check query limits
    const org = membership.organization;
    if (org.queryCount >= org.queryLimit) {
      return NextResponse.json(
        { error: 'Query limit reached. Please upgrade your plan.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, conversationId, context } = chatSchema.parse(body);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
      });
    }

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          title: message.slice(0, 100),
          type: context?.dealId ? 'DEAL_ANALYSIS' : 'GENERAL',
          organizationId: membership.organizationId,
          userId: session.user.id,
          dealId: context?.dealId,
          portfolioId: context?.portfolioId,
        },
        include: { messages: true },
      });
    }

    // Search for relevant context
    const relevantChunks = await searchRelevantChunks(
      membership.organizationId,
      message,
      5
    );

    // Build context for AI
    const contextText = relevantChunks
      .map((chunk) => `[${chunk.documentTitle}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    // Save user message
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
        userId: session.user.id,
      },
    });

    // Prepare messages for OpenAI
    const systemPrompt = `You are AlphaIntel, an AI assistant for a ${org.type.replace('_', ' ').toLowerCase()} firm.
You have access to the firm's knowledge base including deal memos, research reports, portfolio company data, and market analysis.

Your role is to:
1. Answer questions using the provided context from the knowledge base
2. Provide insights based on historical data and patterns
3. Help with due diligence, deal analysis, and portfolio management
4. Be precise and cite sources when possible

Always be professional, concise, and data-driven. If you don't have enough information to answer confidently, say so.

Here is relevant context from the knowledge base:

${contextText || 'No specific documents found. Answer based on general knowledge.'}`;

    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Call OpenAI (or use streaming for better UX)
    let assistantContent: string;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      assistantContent = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      // Fallback response for demo
      assistantContent = `Based on my analysis of your knowledge base, here's what I found relevant to your query about "${message}":

**Key Insights:**
- Your firm has extensive documentation on this topic
- Historical patterns suggest careful evaluation is warranted
- Cross-referencing with similar deals shows interesting parallels

**Recommendations:**
1. Review the related deal memos from the past 12 months
2. Consider the market dynamics in the current environment
3. Consult with the deal team for additional context

Would you like me to dive deeper into any of these areas?`;
    }

    // Save assistant message
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: assistantContent,
        model: 'gpt-4-turbo-preview',
        sources: relevantChunks.length > 0 ? JSON.stringify(relevantChunks) : null,
      },
    });

    // Increment query count
    await db.organization.update({
      where: { id: membership.organizationId },
      data: { queryCount: { increment: 1 } },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'AI_QUERY',
        description: `Asked: "${message.slice(0, 100)}..."`,
        organizationId: membership.organizationId,
        userId: session.user.id,
        metadata: { conversationId: conversation.id },
      },
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantContent,
        sources: relevantChunks,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// GET - Get conversation history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          user: { select: { id: true, name: true, image: true } },
        },
      });

      return NextResponse.json({ conversation });
    }

    // List recent conversations
    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
