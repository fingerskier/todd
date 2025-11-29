import { generate } from './ollamaClient.js';
import { getGenerationModel } from './modelConfig.js';

export async function runPrompt(prompt, options = {}) {
  const model = getGenerationModel(options.model);
  return generate({
    model,
    prompt,
    stream: options.stream ?? false,
    options: options.generationOptions ?? {},
  });
}

export { getGenerationModel };
