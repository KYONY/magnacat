import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAvailableModels } from "./gemini-models";

const mockModelsResponse = {
  models: [
    { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-pro", displayName: "Gemini 2.5 Pro", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash-preview-tts", displayName: "Gemini 2.5 Flash TTS", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-pro-preview-tts", displayName: "Gemini 2.5 Pro TTS", supportedGenerationMethods: ["generateContent"] },
    { name: "models/text-embedding-004", displayName: "Text Embedding", supportedGenerationMethods: ["embedContent"] },
    { name: "models/embedding-001", displayName: "Embedding 001", supportedGenerationMethods: ["embedContent", "generateContent"] },
    { name: "models/imagen-3.0", displayName: "Imagen 3", supportedGenerationMethods: ["generateImages"] },
    { name: "models/aqa", displayName: "AQA", supportedGenerationMethods: ["generateContent"] },
  ],
};

describe("fetchAvailableModels", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and categorizes models correctly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockModelsResponse),
    }));

    const result = await fetchAvailableModels("test-key");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("?key=test-key")
    );

    expect(result.translateModels).toEqual([
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ]);

    expect(result.ttsModels).toEqual([
      { id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS" },
      { id: "gemini-2.5-pro-preview-tts", label: "Gemini 2.5 Pro TTS" },
    ]);
  });

  it("excludes embedding, imagen, and aqa models from translate list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockModelsResponse),
    }));

    const result = await fetchAvailableModels("test-key");

    const translateIds = result.translateModels.map(m => m.id);
    expect(translateIds).not.toContain("text-embedding-004");
    expect(translateIds).not.toContain("embedding-001");
    expect(translateIds).not.toContain("imagen-3.0");
    expect(translateIds).not.toContain("aqa");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }));

    await expect(fetchAvailableModels("bad-key")).rejects.toThrow("Failed to fetch models: 401");
  });

  it("returns empty arrays when API returns no models", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    }));

    const result = await fetchAvailableModels("test-key");
    expect(result.translateModels).toEqual([]);
    expect(result.ttsModels).toEqual([]);
  });

  it("throws on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    await expect(fetchAvailableModels("test-key")).rejects.toThrow("Network failure");
  });
});
