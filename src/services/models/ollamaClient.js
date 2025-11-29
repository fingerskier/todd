import ollama, { Ollama } from 'ollama';

const DEFAULT_HOST = process.env.OLLAMA_HOST?.replace(/\/$/, '');
const client = DEFAULT_HOST ? new Ollama({ host: DEFAULT_HOST }) : ollama;

function normalizeError(error) {
  if (error?.error) {
    const wrapped = new Error(`Ollama error: ${error.error}`);
    wrapped.cause = error;
    return wrapped;
  }

  if (error?.status && error?.message) {
    const wrapped = new Error(`Ollama request failed (${error.status}): ${error.message}`);
    wrapped.cause = error;
    return wrapped;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown error from Ollama client');
}

async function callWithRetry(operation, { retries = 2, initialDelayMs = 200 } = {}) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = normalizeError(error);

      if (attempt === retries) {
        throw lastError;
      }

      const delay = initialDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError ?? new Error('Unknown failure calling Ollama');
}

export async function generate({ model, prompt, stream = false, options = {} }) {
  const data = await callWithRetry(() =>
    client.generate({
      model,
      prompt,
      stream,
      options,
    })
  );

  return {
    model: data.model ?? model,
    response: data.response,
    createdAt: data.created_at,
  };
}

export async function embed({ model, input }) {
  const data = await callWithRetry(() =>
    client.embeddings({
      model,
      prompt: input,
    })
  );

  return {
    model: data.model ?? model,
    embedding: data.embedding,
    createdAt: data.created_at,
  };
}
