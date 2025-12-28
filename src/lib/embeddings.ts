import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for text using OpenAI's text-embedding-ada-002 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000), // Limit input to avoid token limits
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const truncatedTexts = texts.map((text) => text.slice(0, 8000));

  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: truncatedTexts,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into smaller pieces for embedding
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): { content: string; index: number }[] {
  const chunks: { content: string; index: number }[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    // Try to find a natural break point (sentence end, paragraph)
    if (end < text.length) {
      const possibleBreaks = [
        text.lastIndexOf('. ', end),
        text.lastIndexOf('.\n', end),
        text.lastIndexOf('\n\n', end),
        text.lastIndexOf('\n', end),
        text.lastIndexOf(' ', end),
      ];

      const bestBreak = possibleBreaks.find(
        (b) => b > start + maxChunkSize / 2
      );
      if (bestBreak && bestBreak > start) {
        end = bestBreak + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ content: chunk, index });
      index++;
    }

    start = end - overlap;
  }

  return chunks;
}

/**
 * Count tokens in text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}
