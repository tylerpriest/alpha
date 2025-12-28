import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  firmName: z.string().min(2),
  firmType: z.enum(['VENTURE_CAPITAL', 'PRIVATE_EQUITY', 'GROWTH_EQUITY', 'FAMILY_OFFICE', 'CORPORATE_VC', 'FUND_OF_FUNDS', 'OTHER']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Generate unique slug for organization
    let slug = slugify(validatedData.firmName);
    const existingOrg = await db.organization.findUnique({
      where: { slug },
    });
    if (existingOrg) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create user and organization in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          passwordHash,
          role: 'OWNER',
        },
      });

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.firmName,
          slug,
          type: validatedData.firmType,
          subscriptionTier: 'FREE',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: 'USER_JOINED',
          description: `${validatedData.name} created ${validatedData.firmName}`,
          organizationId: organization.id,
          userId: user.id,
        },
      });

      return { user, organization };
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: result.user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
