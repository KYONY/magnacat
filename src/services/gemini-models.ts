import { GEMINI_BASE_URL } from "../utils/models";
import type { ModelOption } from "../utils/models";

interface GeminiModel {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
}

interface ModelsResponse {
  models: GeminiModel[];
}

export interface FetchedModels {
  translateModels: ModelOption[];
  ttsModels: ModelOption[];
}

export async function fetchAvailableModels(apiKey: string): Promise<FetchedModels> {
  const resp = await fetch(`${GEMINI_BASE_URL}?key=${apiKey}`);
  if (!resp.ok) throw new Error(`Failed to fetch models: ${resp.status}`);
  const data: ModelsResponse = await resp.json();

  const translateModels: ModelOption[] = [];
  const ttsModels: ModelOption[] = [];

  for (const m of data.models) {
    const id = m.name.replace("models/", "");
    const label = m.displayName;
    if (isTtsModel(id, m.supportedGenerationMethods)) {
      ttsModels.push({ id, label });
    } else if (isTranslateModel(id, m.supportedGenerationMethods)) {
      translateModels.push({ id, label });
    }
  }

  return { translateModels, ttsModels };
}

function isTtsModel(id: string, methods: string[]): boolean {
  return id.includes("tts") && methods.includes("generateContent");
}

function isTranslateModel(id: string, methods: string[]): boolean {
  return methods.includes("generateContent")
    && !id.includes("tts")
    && !id.includes("embedding")
    && !id.includes("imagen")
    && !id.includes("aqa");
}
