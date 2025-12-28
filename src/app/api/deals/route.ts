import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createDealSchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().url().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  currentStage: z
    .enum([
      'SOURCED',
      'SCREENING',
      'FIRST_MEETING',
      'DD',
      'IC',
      'TERM_SHEET',
      'CLOSED_WON',
      'PASSED',
    ])
    .optional()
    .default('SOURCED'),
  askAmount: z.number().positive().optional().nullable(),
  valuation: z.number().positive().optional().nullable(),
  leadPartner: z.string().max(100).optional().nullable(),
  source: z.string().max(200).optional().nullable(),
});

// GET /api/deals - List deals
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

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

    // Build query
    let query = supabase
      .from('deals')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('created_at', { ascending: false });

    // Filter by stage if provided
    const stage = searchParams.get('stage');
    if (stage) {
      query = query.eq('current_stage', stage);
    }

    // Filter by sector if provided
    const sector = searchParams.get('sector');
    if (sector) {
      query = query.eq('sector', sector);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data: deals, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total: count ?? deals?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('List deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create a deal
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

    // Get user's organization and role
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      );
    }

    // Check role permissions
    if (member.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot create deals' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      companyName,
      website,
      description,
      sector,
      currentStage,
      askAmount,
      valuation,
      leadPartner,
      source,
    } = parsed.data;

    // Create deal
    const { data: deal, error: createError } = await supabase
      .from('deals')
      .insert({
        organization_id: member.organization_id,
        company_name: companyName,
        website,
        description,
        sector,
        current_stage: currentStage,
        ask_amount: askAmount,
        valuation,
        lead_partner: leadPartner,
        source,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create deal error:', createError);
      return NextResponse.json(
        { error: 'Failed to create deal' },
        { status: 500 }
      );
    }

    // Create initial stage history
    await supabase.from('deal_stage_history').insert({
      deal_id: deal.id,
      to_stage: currentStage,
      changed_by: user.id,
      notes: 'Deal created',
    });

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: member.organization_id,
      user_id: user.id,
      action: 'created',
      entity_type: 'deal',
      entity_id: deal.id,
      metadata: { companyName },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
