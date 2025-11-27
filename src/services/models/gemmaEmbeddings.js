import { embed } from './ollamaClient.js';

const DEFAULT_GEMMA_EMBED_MODEL = process.env.TODD_GEMMA_EMBED_MODEL || 'gemma2:2b-instruct';

export async function embedText(text, options = {}) {
  const model = options.model || DEFAULT_GEMMA_EMBED_MODEL;
  return embed({
    model,
    input: text,
  });
}

export function getGemmaEmbedModel() {
  return DEFAULT_GEMMA_EMBED_MODEL;
}
