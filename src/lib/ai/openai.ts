import OpenAI from 'openai';

// Lazy-initialize OpenAI client to avoid build-time errors
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export { getOpenAI as openai };

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000), // Limit to ~8000 chars
  });

  return response.data[0].embedding;
}

// Generate embeddings for multiple texts (batched)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // OpenAI allows batching up to 2048 inputs
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));

    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-ada-002',
      input: batch,
    });

    allEmbeddings.push(...response.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

// Chat completion with streaming
export async function streamChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await getOpenAI().chat.completions.create({
    model: options?.model ?? 'gpt-4-turbo-preview',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
    stream: true,
  });

  return response;
}

// Chat completion without streaming (for analysis tasks)
export async function chat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await getOpenAI().chat.completions.create({
    model: options?.model ?? 'gpt-4-turbo-preview',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  });

  return {
    content: response.choices[0].message.content,
    usage: response.usage,
  };
}

// Count tokens (approximate)
export function countTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
