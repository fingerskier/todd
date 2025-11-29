const DEFAULT_GENERATION_MODEL = process.env.TODD_GENERATION_MODEL || 'gemma2:9b-instruct';
const DEFAULT_EMBEDDING_MODEL = process.env.TODD_EMBEDDING_MODEL || 'gemma2:2b-instruct';

export function getGenerationModel(override) {
  return override || DEFAULT_GENERATION_MODEL;
}

export function getEmbeddingModel(override) {
  return override || DEFAULT_EMBEDDING_MODEL;
}

export function getModelConfig() {
  return {
    generationModel: DEFAULT_GENERATION_MODEL,
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
  };
}
