import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET - List documents
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const membership = await db.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const folderId = searchParams.get('folderId');

    const where = {
      organizationId: membership.organizationId,
      ...(type && { type }),
      ...(status && { status }),
      ...(folderId && { folderId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where: where as any,
        include: {
          uploadedBy: {
            select: { id: true, name: true, image: true },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { chunks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.document.count({ where: where as any }),
    ]);

    return NextResponse.json({
      items: documents,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST - Upload document metadata (file upload would be separate S3 presigned URL flow)
const uploadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  storageKey: z.string(),
  type: z.enum([
    'PDF', 'WORD', 'EXCEL', 'POWERPOINT', 'TEXT', 'MARKDOWN', 'HTML',
    'EMAIL', 'TRANSCRIPT', 'FINANCIAL_MODEL', 'PITCH_DECK', 'TERM_SHEET',
    'LEGAL_DOC', 'RESEARCH_REPORT', 'MEMO', 'OTHER'
  ]).default('OTHER'),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
    const validatedData = uploadSchema.parse(body);

    // Create document
    const document = await db.document.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileType: validatedData.fileType,
        fileSize: BigInt(validatedData.fileSize),
        mimeType: validatedData.mimeType,
        storageKey: validatedData.storageKey,
        type: validatedData.type,
        status: 'UPLOADING',
        organizationId: membership.organizationId,
        uploadedById: session.user.id,
        folderId: validatedData.folderId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'DOCUMENT_UPLOADED',
        description: `Uploaded ${validatedData.title}`,
        organizationId: membership.organizationId,
        userId: session.user.id,
        documentId: document.id,
      },
    });

    // Update organization storage used
    await db.organization.update({
      where: { id: membership.organizationId },
      data: {
        storageUsed: { increment: BigInt(validatedData.fileSize) },
      },
    });

    // In production, you would trigger document processing here
    // e.g., send to a queue for text extraction and embedding generation

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        fileSize: document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating document:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
