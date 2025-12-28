import { chunkText } from '@/lib/ai/chunking';
import { generateEmbeddings } from '@/lib/ai/openai';
import { createAdminClient } from '@/lib/supabase/server';

// Extract text from various document types
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; pageCount?: number }> {
  switch (mimeType) {
    case 'application/pdf':
      return extractPdfText(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);
    case 'text/plain':
    case 'text/markdown':
      return { text: buffer.toString('utf-8') };
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

// Extract text from PDF using pdfjs-dist
async function extractPdfText(
  buffer: Buffer
): Promise<{ text: string; pageCount?: number }> {
  const pdfjsLib = await import('pdfjs-dist');

  // Load PDF document
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const textParts: string[] = [];

  // Extract text from each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter(item => 'str' in item)
      .map(item => (item as { str: string }).str)
      .join(' ');
    textParts.push(pageText);
  }

  return {
    text: textParts.join('\n\n'),
    pageCount: pdf.numPages,
  };
}

// Extract text from DOCX
async function extractDocxText(
  buffer: Buffer
): Promise<{ text: string; pageCount?: number }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: result.value,
  };
}

// Process a document: extract text, chunk, embed, store
export async function processDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    // 1. Update status to PROCESSING
    await supabase
      .from('documents')
      .update({ status: 'PROCESSING' })
      .eq('id', documentId);

    // 2. Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // 3. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 4. Extract text
    const { text, pageCount } = await extractText(buffer, doc.mime_type);

    if (!text || text.trim().length < 10) {
      throw new Error('Failed to extract meaningful text from document');
    }

    // 5. Chunk the text
    const chunks = chunkText(text, {
      maxTokens: 500,
      overlap: 50,
      preserveParagraphs: true,
    });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    // 6. Generate embeddings
    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content)
    );

    // 7. Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      // Use raw SQL to insert with vector type
      const { error: chunkError } = await supabase.rpc('insert_chunk', {
        p_document_id: documentId,
        p_content: chunk.content,
        p_embedding: embedding,
        p_chunk_index: chunk.index,
        p_page_number: chunk.pageNumber ?? null,
        p_token_count: chunk.tokenCount,
      });

      if (chunkError) {
        console.error(`Failed to insert chunk ${i}:`, chunkError);
        // Continue with other chunks
      }
    }

    // 8. Update document status
    await supabase
      .from('documents')
      .update({
        status: 'INDEXED',
        text_content: text,
        page_count: pageCount ?? null,
      })
      .eq('id', documentId);

    console.log(
      `Document ${documentId} processed: ${chunks.length} chunks created`
    );
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error);

    // Update status to FAILED
    await supabase
      .from('documents')
      .update({
        status: 'FAILED',
        processing_error:
          error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);

    throw error;
  }
}

// Queue document for processing (for use with background jobs)
export async function queueDocumentProcessing(
  documentId: string
): Promise<void> {
  // In a production app, this would add to a job queue (e.g., BullMQ)
  // For now, we process directly (can be moved to an edge function)
  await processDocument(documentId);
}
