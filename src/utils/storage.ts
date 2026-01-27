export interface Settings {
  sourceLang: string;
  targetLang: string;
}

const DEFAULT_SETTINGS: Settings = {
  sourceLang: "auto",
  targetLang: "uk",
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
