import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { processDocument } from '@/lib/services/document-processing';

// POST /api/documents/[id]/process - Process a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document belongs to user's organization
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, organization_id, status')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check user has access to this organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', document.organization_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check document status
    if (document.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'Document is already being processed' },
        { status: 400 }
      );
    }

    if (document.status === 'INDEXED') {
      return NextResponse.json(
        { error: 'Document has already been processed' },
        { status: 400 }
      );
    }

    // Process document (in production, this would be a background job)
    // For now, we process synchronously but could timeout for large files
    try {
      await processDocument(documentId);

      return NextResponse.json({
        id: documentId,
        status: 'INDEXED',
        message: 'Document processed successfully',
      });
    } catch (processError) {
      console.error('Processing error:', processError);
      return NextResponse.json(
        {
          id: documentId,
          status: 'FAILED',
          error:
            processError instanceof Error
              ? processError.message
              : 'Processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
