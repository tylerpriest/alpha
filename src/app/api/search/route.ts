import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all' | 'documents' | 'deals' | 'portfolio'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const results: {
      documents: any[];
      deals: any[];
      portfolio: any[];
    } = {
      documents: [],
      deals: [],
      portfolio: [],
    };

    const orgId = membership.organizationId;

    // Search documents
    if (!type || type === 'all' || type === 'documents') {
      const documents = await db.document.findMany({
        where: {
          organizationId: orgId,
          status: 'INDEXED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          summary: true,
          createdAt: true,
          uploadedBy: {
            select: { name: true },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      results.documents = documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        excerpt: doc.summary?.slice(0, 200) || '',
        date: doc.createdAt,
        author: doc.uploadedBy?.name,
        relevance: 0.9, // Placeholder - would use vector similarity
      }));
    }

    // Search deals
    if (!type || type === 'all' || type === 'deals') {
      const deals = await db.deal.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { companyName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sector: { contains: query, mode: 'insensitive' } },
            { investmentThesis: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          stage: true,
          sector: true,
          description: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      results.deals = deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        sector: deal.sector,
        excerpt: deal.description?.slice(0, 200) || '',
        relevance: 0.85,
      }));
    }

    // Search portfolio companies
    if (!type || type === 'all' || type === 'portfolio') {
      const portfolio = await db.portfolioCompany.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sector: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          sector: true,
          description: true,
          status: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      results.portfolio = portfolio.map((company) => ({
        id: company.id,
        name: company.name,
        sector: company.sector,
        status: company.status,
        excerpt: company.description?.slice(0, 200) || '',
        relevance: 0.8,
      }));
    }

    // Log search activity
    await db.activity.create({
      data: {
        type: 'AI_QUERY',
        description: `Searched: "${query}"`,
        organizationId: orgId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Semantic search endpoint
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await db.organizationMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { query, limit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Generate embedding for query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fall back to text search
      return NextResponse.json({
        results: [],
        fallback: true,
        message: 'Semantic search unavailable, use text search instead',
      });
    }

    // In production, use pgvector for vector similarity search
    // For now, return recent indexed documents
    const documents = await db.document.findMany({
      where: {
        organizationId: membership.organizationId,
        status: 'INDEXED',
      },
      include: {
        chunks: {
          take: 1,
          orderBy: { chunkIndex: 'asc' },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const results = documents.map((doc) => ({
      documentId: doc.id,
      documentTitle: doc.title,
      content: doc.chunks[0]?.content || doc.summary || '',
      score: Math.random() * 0.2 + 0.8, // Placeholder score
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    );
  }
}
