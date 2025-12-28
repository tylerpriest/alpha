import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET - List deals
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const stage = searchParams.get('stage');
    const fundId = searchParams.get('fundId');
    const leadPartnerId = searchParams.get('leadPartnerId');
    const search = searchParams.get('search');

    const where = {
      organizationId: membership.organizationId,
      ...(stage && { stage }),
      ...(fundId && { fundId }),
      ...(leadPartnerId && { leadPartnerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where: where as any,
        include: {
          leadPartner: {
            select: { id: true, name: true, image: true },
          },
          fund: {
            select: { id: true, name: true },
          },
          _count: {
            select: { documents: true, comments: true, conversations: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deal.count({ where: where as any }),
    ]);

    // Transform BigInt/Decimal to strings for JSON serialization
    const serializedDeals = deals.map((deal) => ({
      ...deal,
      revenue: deal.revenue?.toString(),
      burnRate: deal.burnRate?.toString(),
      askAmount: deal.askAmount?.toString(),
      preMoneyVal: deal.preMoneyVal?.toString(),
      aiScore: deal.aiScore?.toString(),
      teamScore: deal.teamScore?.toString(),
      marketScore: deal.marketScore?.toString(),
      productScore: deal.productScore?.toString(),
    }));

    return NextResponse.json({
      items: serializedDeals,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST - Create deal
const dealSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().min(1),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  subSector: z.string().optional(),
  location: z.string().optional(),
  foundedYear: z.number().int().min(1900).max(2100).optional(),
  employeeCount: z.number().int().min(0).optional(),
  revenue: z.number().optional(),
  askAmount: z.number().optional(),
  preMoneyVal: z.number().optional(),
  source: z.enum([
    'INBOUND', 'OUTBOUND', 'REFERRAL', 'PORTFOLIO', 'CONFERENCE', 'COLD_OUTREACH', 'OTHER'
  ]).default('INBOUND'),
  fundId: z.string().optional(),
  leadPartnerId: z.string().optional(),
  investmentThesis: z.string().optional(),
  contacts: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

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

    const body = await req.json();
    const validatedData = dealSchema.parse(body);

    const deal = await db.deal.create({
      data: {
        name: validatedData.name,
        companyName: validatedData.companyName,
        website: validatedData.website || null,
        description: validatedData.description,
        industry: validatedData.industry,
        sector: validatedData.sector,
        subSector: validatedData.subSector,
        location: validatedData.location,
        foundedYear: validatedData.foundedYear,
        employeeCount: validatedData.employeeCount,
        revenue: validatedData.revenue,
        askAmount: validatedData.askAmount,
        preMoneyVal: validatedData.preMoneyVal,
        source: validatedData.source,
        stage: 'SOURCED',
        organizationId: membership.organizationId,
        fundId: validatedData.fundId || null,
        leadPartnerId: validatedData.leadPartnerId || session.user.id,
        investmentThesis: validatedData.investmentThesis,
        contacts: validatedData.contacts ? {
          create: validatedData.contacts,
        } : undefined,
      },
      include: {
        leadPartner: {
          select: { id: true, name: true, image: true },
        },
        fund: {
          select: { id: true, name: true },
        },
        contacts: true,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'DEAL_CREATED',
        description: `Created deal: ${validatedData.name}`,
        organizationId: membership.organizationId,
        userId: session.user.id,
        dealId: deal.id,
      },
    });

    return NextResponse.json({
      success: true,
      deal: {
        ...deal,
        revenue: deal.revenue?.toString(),
        askAmount: deal.askAmount?.toString(),
        preMoneyVal: deal.preMoneyVal?.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating deal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
