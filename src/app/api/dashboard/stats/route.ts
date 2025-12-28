import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/dashboard/stats - Get dashboard statistics (REAL data, not mocks)
export async function GET() {
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

    const orgId = member.organization_id;

    // Fetch ALL stats in parallel - REAL database queries, no mocks
    const [
      documentsResult,
      indexedDocsResult,
      dealsResult,
      dealsByStageResult,
      conversationsResult,
      recentActivityResult,
      orgResult,
    ] = await Promise.all([
      // Total documents count
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Indexed documents count
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'INDEXED'),

      // Total deals count
      supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Deals by stage
      supabase
        .from('deals')
        .select('current_stage')
        .eq('organization_id', orgId),

      // Total conversations count
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Recent activity (last 10)
      supabase
        .from('activity_log')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Organization details (limits and usage)
      supabase
        .from('organizations')
        .select(
          'documents_limit, queries_per_month, queries_used_this_month, plan'
        )
        .eq('id', orgId)
        .single(),
    ]);

    // Calculate deals by stage
    const dealsByStage: Record<string, number> = {};
    if (dealsByStageResult.data) {
      for (const deal of dealsByStageResult.data) {
        const stage = deal.current_stage;
        dealsByStage[stage] = (dealsByStage[stage] ?? 0) + 1;
      }
    }

    // Calculate active deals (not PASSED or CLOSED_WON)
    const activeDeals =
      Object.entries(dealsByStage)
        .filter(([stage]) => !['PASSED', 'CLOSED_WON'].includes(stage))
        .reduce((sum, [, count]) => sum + count, 0);

    return NextResponse.json({
      documents: {
        total: documentsResult.count ?? 0,
        indexed: indexedDocsResult.count ?? 0,
        limit: orgResult.data?.documents_limit ?? 100,
      },
      deals: {
        total: dealsResult.count ?? 0,
        active: activeDeals,
        byStage: dealsByStage,
      },
      conversations: {
        total: conversationsResult.count ?? 0,
      },
      usage: {
        queriesUsed: orgResult.data?.queries_used_this_month ?? 0,
        queriesLimit: orgResult.data?.queries_per_month ?? 500,
        plan: orgResult.data?.plan ?? 'FREE',
      },
      recentActivity: recentActivityResult.data ?? [],
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
