// Text chunking utilities for document processing

export interface Chunk {
  content: string;
  index: number;
  pageNumber?: number;
  tokenCount: number;
}

interface ChunkOptions {
  maxTokens?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
}

// Estimate token count (rough approximation)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Split text into chunks with overlap
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const {
    maxTokens = 500,
    overlap = 50,
    preserveParagraphs = true,
  } = options;

  const chunks: Chunk[] = [];

  // If preserving paragraphs, split by double newlines first
  const paragraphs = preserveParagraphs
    ? text.split(/\n\n+/).filter((p) => p.trim())
    : [text];

  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If a single paragraph is too long, split it by sentences
    if (paragraphTokens > maxTokens) {
      // First, save any accumulated content
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          tokenCount: estimateTokens(currentChunk),
        });
        currentChunk = '';
      }

      // Split long paragraph by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let sentenceBuffer = '';

      for (const sentence of sentences) {
        const combinedTokens = estimateTokens(sentenceBuffer + ' ' + sentence);

        if (combinedTokens > maxTokens && sentenceBuffer) {
          chunks.push({
            content: sentenceBuffer.trim(),
            index: chunkIndex++,
            tokenCount: estimateTokens(sentenceBuffer),
          });

          // Add overlap from the end of the previous chunk
          const overlapText = getOverlapText(sentenceBuffer, overlap);
          sentenceBuffer = overlapText + ' ' + sentence;
        } else {
          sentenceBuffer = sentenceBuffer
            ? sentenceBuffer + ' ' + sentence
            : sentence;
        }
      }

      if (sentenceBuffer.trim()) {
        currentChunk = sentenceBuffer;
      }
    } else {
      const combinedTokens = estimateTokens(currentChunk + '\n\n' + paragraph);

      if (combinedTokens > maxTokens && currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          tokenCount: estimateTokens(currentChunk),
        });

        // Add overlap from the end of the previous chunk
        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + '\n\n' + paragraph;
      } else {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + paragraph
          : paragraph;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex++,
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

// Get overlap text from the end of a chunk
function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.split(/\s+/);
  const overlapWords = Math.ceil(overlapTokens / 1.3); // ~1.3 tokens per word

  if (words.length <= overlapWords) {
    return text;
  }

  return words.slice(-overlapWords).join(' ');
}

// Chunk with page number tracking (for PDFs)
export function chunkTextWithPages(
  pages: { content: string; pageNumber: number }[],
  options: ChunkOptions = {}
): Chunk[] {
  const { maxTokens = 500, overlap = 50 } = options;

  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let currentChunk = '';
  let currentPage = pages[0]?.pageNumber ?? 1;

  for (const page of pages) {
    const paragraphs = page.content.split(/\n\n+/).filter((p) => p.trim());

    for (const paragraph of paragraphs) {
      const paragraphTokens = estimateTokens(paragraph);
      const combinedTokens = estimateTokens(currentChunk + '\n\n' + paragraph);

      if (combinedTokens > maxTokens && currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          pageNumber: currentPage,
          tokenCount: estimateTokens(currentChunk),
        });

        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + '\n\n' + paragraph;
        currentPage = page.pageNumber;
      } else {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + paragraph
          : paragraph;

        // Update page if this is the first content in chunk
        if (!currentChunk.includes('\n\n')) {
          currentPage = page.pageNumber;
        }
      }
    }
  }

  // Last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex++,
      pageNumber: currentPage,
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}
