import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { semanticSearch, hybridSearch } from '@/lib/services/search';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  documentType: z.string().optional(),
  hybrid: z.boolean().optional().default(false),
});

// POST /api/search - Semantic search across documents
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
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, limit, threshold, documentType, hybrid } = parsed.data;

    // Perform search
    const results = hybrid
      ? await hybridSearch(query, member.organization_id, { limit, threshold })
      : await semanticSearch(query, member.organization_id, {
          limit,
          threshold,
          documentType,
        });

    // Increment query usage
    await supabase.rpc('increment_query_count', {
      org_id: member.organization_id,
    });

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: member.organization_id,
      user_id: user.id,
      action: 'searched',
      entity_type: 'search',
      entity_id: 'query',
      metadata: { query, resultCount: results.length },
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
