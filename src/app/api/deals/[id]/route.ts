import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateDealSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
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
    .optional(),
  askAmount: z.number().positive().optional().nullable(),
  valuation: z.number().positive().optional().nullable(),
  leadPartner: z.string().max(100).optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  passReason: z.string().max(2000).optional().nullable(),
  stageNotes: z.string().max(2000).optional(),
});

// GET /api/deals/[id] - Get a single deal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get deal with related data
    const { data: deal, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        deal_stage_history (
          id,
          from_stage,
          to_stage,
          notes,
          created_at
        ),
        deal_documents (
          document_id,
          documents (
            id,
            title,
            document_type,
            status
          )
        )
      `
      )
      .eq('id', dealId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', deal.organization_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Get deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/deals/[id] - Update a deal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing deal
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify user has access
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', existingDeal.organization_id)
      .single();

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateDealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stageNotes, ...updateData } = parsed.data;

    // Check for stage change
    const stageChanged =
      updateData.currentStage &&
      updateData.currentStage !== existingDeal.current_stage;

    // Build update object
    const updatePayload: Record<string, unknown> = {};

    if (updateData.companyName)
      updatePayload.company_name = updateData.companyName;
    if (updateData.website !== undefined)
      updatePayload.website = updateData.website;
    if (updateData.description !== undefined)
      updatePayload.description = updateData.description;
    if (updateData.sector !== undefined)
      updatePayload.sector = updateData.sector;
    if (updateData.currentStage)
      updatePayload.current_stage = updateData.currentStage;
    if (updateData.askAmount !== undefined)
      updatePayload.ask_amount = updateData.askAmount;
    if (updateData.valuation !== undefined)
      updatePayload.valuation = updateData.valuation;
    if (updateData.leadPartner !== undefined)
      updatePayload.lead_partner = updateData.leadPartner;
    if (updateData.source !== undefined)
      updatePayload.source = updateData.source;
    if (updateData.passReason !== undefined)
      updatePayload.pass_reason = updateData.passReason;

    // Update deal
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update(updatePayload)
      .eq('id', dealId)
      .select()
      .single();

    if (updateError) {
      console.error('Update deal error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      );
    }

    // Record stage change if applicable
    if (stageChanged && updateData.currentStage) {
      await supabase.from('deal_stage_history').insert({
        deal_id: dealId,
        from_stage: existingDeal.current_stage,
        to_stage: updateData.currentStage,
        changed_by: user.id,
        notes: stageNotes ?? null,
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: existingDeal.organization_id,
      user_id: user.id,
      action: stageChanged ? 'stage_changed' : 'updated',
      entity_type: 'deal',
      entity_id: dealId,
      metadata: stageChanged
        ? {
            fromStage: existingDeal.current_stage,
            toStage: updateData.currentStage,
          }
        : { fields: Object.keys(updatePayload) },
    });

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Update deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing deal
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify user has admin access
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', existingDeal.organization_id)
      .single();

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Only admins can delete deals' },
        { status: 403 }
      );
    }

    // Delete deal
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (deleteError) {
      console.error('Delete deal error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete deal' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: existingDeal.organization_id,
      user_id: user.id,
      action: 'deleted',
      entity_type: 'deal',
      entity_id: dealId,
      metadata: { companyName: existingDeal.company_name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
