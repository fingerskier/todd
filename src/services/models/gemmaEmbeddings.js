import { embed } from './ollamaClient.js';
import { getEmbeddingModel } from './modelConfig.js';

export async function embedText(text, options = {}) {
  const model = getEmbeddingModel(options.model);
  return embed({
    model,
    input: text,
  });
}

export { getEmbeddingModel };
