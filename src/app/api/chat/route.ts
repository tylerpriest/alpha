import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  ragChat,
  saveMessage,
  createConversation,
} from '@/lib/services/chat';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});

// POST /api/chat - RAG-powered chat
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      );
    }

    // Check query usage limits
    const { data: org } = await supabase
      .from('organizations')
      .select('queries_per_month, queries_used_this_month')
      .eq('id', member.organization_id)
      .single();

    if (org && org.queries_used_this_month >= org.queries_per_month) {
      return NextResponse.json(
        { error: 'Query limit reached. Upgrade your plan.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, conversationId: existingConversationId, dealId } =
      parsed.data;

    // Create or get conversation
    let conversationId = existingConversationId;

    if (!conversationId) {
      conversationId = await createConversation(
        member.organization_id,
        user.id,
        { dealId }
      );
    }

    // Save user message
    await saveMessage(conversationId, 'user', message);

    // Get AI response with RAG
    const response = await ragChat(
      message,
      conversationId,
      member.organization_id
    );

    // Save assistant message
    await saveMessage(conversationId, 'assistant', response.content, {
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      citations: response.citations,
    });

    // Increment query usage
    await supabase.rpc('increment_query_count', {
      org_id: member.organization_id,
    });

    // Update conversation title if it's new
    if (!existingConversationId) {
      const title =
        message.length > 50 ? message.slice(0, 47) + '...' : message;
      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: member.organization_id,
      user_id: user.id,
      action: 'chatted',
      entity_type: 'conversation',
      entity_id: conversationId,
      metadata: {
        tokensUsed: response.promptTokens + response.completionTokens,
        citationsCount: response.citations.length,
      },
    });

    return NextResponse.json({
      conversationId,
      message: {
        role: 'assistant',
        content: response.content,
        citations: response.citations,
      },
      usage: {
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
