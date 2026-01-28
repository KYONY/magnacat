import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMessage } from "./handlers";
import type { Message } from "./types";

vi.mock("../services/gemini-translate", () => ({
  translate: vi.fn(),
}));

vi.mock("../services/gemini-tts", () => ({
  synthesizeSpeech: vi.fn(),
}));

vi.mock("../utils/language-detect", () => ({
  detectLanguage: vi.fn(),
}));

vi.mock("../utils/storage", () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  getApiKey: vi.fn(),
  saveApiKey: vi.fn(),
}));

vi.mock("../services/gemini-models", () => ({
  fetchAvailableModels: vi.fn(),
}));

import { translate } from "../services/gemini-translate";
import { synthesizeSpeech } from "../services/gemini-tts";
import { detectLanguage } from "../utils/language-detect";
import { getSettings, saveSettings, getApiKey, saveApiKey } from "../utils/storage";
import { fetchAvailableModels } from "../services/gemini-models";

const mockTranslate = vi.mocked(translate);
const mockSynthesize = vi.mocked(synthesizeSpeech);
const mockDetect = vi.mocked(detectLanguage);
const mockGetSettings = vi.mocked(getSettings);
const mockSaveSettings = vi.mocked(saveSettings);
const mockGetApiKey = vi.mocked(getApiKey);
const mockSaveApiKey = vi.mocked(saveApiKey);
const mockFetchModels = vi.mocked(fetchAvailableModels);

const defaultSettings = {
  sourceLang: "auto",
  targetLang: "uk",
  theme: "system" as const,
  showTriggerIcon: true,
  shortcut: "Ctrl+Shift+X",
  translateModel: "gemini-2.5-flash",
  ttsModel: "gemini-2.5-flash-preview-tts",
};

describe("handleMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiKey.mockResolvedValue("test-key");
    mockGetSettings.mockResolvedValue(defaultSettings);
  });

  it("handles TRANSLATE message", async () => {
    mockTranslate.mockResolvedValue("привіт");
    const msg: Message = { type: "TRANSLATE", text: "hello", from: "en", to: "uk" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: "привіт" });
    expect(mockTranslate).toHaveBeenCalledWith("hello", "en", "uk", "test-key", "gemini-2.5-flash");
  });

  it("handles TTS message and returns base64-encoded string", async () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const fakeBuffer = bytes.buffer;
    mockSynthesize.mockResolvedValue(fakeBuffer);
    const msg: Message = { type: "TTS", text: "hello", voice: "Kore" };
    const result = await handleMessage(msg);
    expect(result.success).toBe(true);
    expect(typeof result.data).toBe("string");
    // Verify the base64 data decodes back to the original bytes
    const decoded = atob(result.data as string);
    expect(decoded.length).toBe(5);
    expect(decoded.charCodeAt(0)).toBe(72); // 'H'
    expect(mockSynthesize).toHaveBeenCalledWith("hello", "Kore", "test-key", "gemini-2.5-flash-preview-tts");
  });

  it("handles DETECT_LANG message", async () => {
    mockDetect.mockReturnValue("uk");
    const msg: Message = { type: "DETECT_LANG", text: "привіт" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: "uk" });
  });

  it("handles GET_SETTINGS message", async () => {
    const settings = { sourceLang: "auto", targetLang: "uk" };
    mockGetSettings.mockResolvedValue(settings);
    const msg: Message = { type: "GET_SETTINGS" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: settings });
  });

  it("handles SAVE_SETTINGS message", async () => {
    mockSaveSettings.mockResolvedValue(undefined);
    const settings = { sourceLang: "en", targetLang: "uk" };
    const msg: Message = { type: "SAVE_SETTINGS", settings };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true });
    expect(mockSaveSettings).toHaveBeenCalledWith(settings);
  });

  it("handles GET_API_KEY message", async () => {
    const msg: Message = { type: "GET_API_KEY" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: "test-key" });
  });

  it("handles SAVE_API_KEY message", async () => {
    mockSaveApiKey.mockResolvedValue(undefined);
    const msg: Message = { type: "SAVE_API_KEY", apiKey: "new-key" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true });
    expect(mockSaveApiKey).toHaveBeenCalledWith("new-key");
  });

  it("returns error for unknown message type", async () => {
    const msg = { type: "UNKNOWN" } as unknown as Message;
    const result = await handleMessage(msg);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when service throws", async () => {
    mockTranslate.mockRejectedValue(new Error("API fail"));
    const msg: Message = { type: "TRANSLATE", text: "x", from: "en", to: "uk" };
    const result = await handleMessage(msg);
    expect(result.success).toBe(false);
    expect(result.error).toBe("API fail");
  });

  it("handles FETCH_MODELS message", async () => {
    const models = {
      translateModels: [{ id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" }],
      ttsModels: [{ id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS" }],
    };
    mockFetchModels.mockResolvedValue(models);
    const msg: Message = { type: "FETCH_MODELS" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: models });
    expect(mockFetchModels).toHaveBeenCalledWith("test-key");
  });

  it("handles FETCH_MODELS with no API key", async () => {
    mockGetApiKey.mockResolvedValue(null);
    const msg: Message = { type: "FETCH_MODELS" };
    const result = await handleMessage(msg);
    expect(result).toEqual({ success: true, data: { translateModels: [], ttsModels: [] } });
    expect(mockFetchModels).not.toHaveBeenCalled();
  });
});
