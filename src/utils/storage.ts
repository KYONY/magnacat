import { DEFAULT_SHORTCUT } from "./shortcut";
import { DEFAULT_TRANSLATE_MODEL, DEFAULT_TTS_MODEL } from "./models";

export type Theme = "light" | "dark" | "system";

export interface Settings {
  sourceLang: string;
  targetLang: string;
  theme: Theme;
  showTriggerIcon: boolean;
  shortcut: string;
  translateModel: string;
  ttsModel: string;
}

const DEFAULT_SETTINGS: Settings = {
  sourceLang: "auto",
  targetLang: "uk",
  theme: "system",
  showTriggerIcon: true,
  shortcut: DEFAULT_SHORTCUT,
  translateModel: DEFAULT_TRANSLATE_MODEL,
  ttsModel: DEFAULT_TTS_MODEL,
};

export async function saveApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ apiKey });
}

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get("apiKey");
  return result.apiKey ?? null;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get("settings");
  return result.settings ?? DEFAULT_SETTINGS;
}
