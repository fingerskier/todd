import { generate } from './ollamaClient.js';

const DEFAULT_GEMINI_MODEL = process.env.TODD_GEMINI_MODEL || 'gemma2:9b-instruct';

export async function runPrompt(prompt, options = {}) {
  const model = options.model || DEFAULT_GEMINI_MODEL;
  return generate({
    model,
    prompt,
    stream: options.stream ?? false,
    options: options.generationOptions ?? {},
  });
}

export function getGeminiModel() {
  return DEFAULT_GEMINI_MODEL;
}
