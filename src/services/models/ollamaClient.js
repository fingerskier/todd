const DEFAULT_BASE_URL = process.env.OLLAMA_HOST?.replace(/\/$/, '') || 'http://127.0.0.1:11434';

async function request(endpoint, payload) {
  const response = await fetch(`${DEFAULT_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function generate({ model, prompt, stream = false, options = {} }) {
  const data = await request('/api/generate', {
    model,
    prompt,
    stream,
    options,
  });

  return {
    model,
    response: data.response,
    createdAt: data.created_at,
  };
}

export async function embed({ model, input }) {
  const data = await request('/api/embeddings', {
    model,
    prompt: input,
  });

  return {
    model,
    embedding: data.embedding,
    createdAt: data.created_at,
  };
}
