import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// POST /api/documents/upload - Upload a document
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
        { error: 'Viewers cannot upload documents' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'OTHER';
    const title = (formData.get('title') as string) || file?.name;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Check organization limits
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id);

    const { data: org } = await supabase
      .from('organizations')
      .select('documents_limit')
      .eq('id', member.organization_id)
      .single();

    if (count && org && count >= org.documents_limit) {
      return NextResponse.json(
        { error: 'Document limit reached. Upgrade your plan.' },
        { status: 403 }
      );
    }

    // Generate storage path
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const storagePath = `${member.organization_id}/${fileId}.${fileExt}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        organization_id: member.organization_id,
        uploaded_by: user.id,
        title: title || file.name,
        original_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        document_type: documentType,
        source_type: 'UPLOAD',
        status: 'PENDING',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: member.organization_id,
      user_id: user.id,
      action: 'uploaded',
      entity_type: 'document',
      entity_id: document.id,
      metadata: { fileName: file.name, fileSize: file.size },
    });

    // Return document ID - processing will be triggered separately
    return NextResponse.json({
      id: document.id,
      status: 'PENDING',
      message: 'Document uploaded. Processing will begin shortly.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
