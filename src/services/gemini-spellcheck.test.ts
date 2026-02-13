import { describe, it, expect, vi, beforeEach } from "vitest";
import { spellCheck } from "./gemini-spellcheck";

describe("gemini-spellcheck", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns corrected text from API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: "привіт світ" }] } }],
      }),
    }));

    const result = await spellCheck("привіт сівт", "uk", "test-key", "gemini-2.5-flash");
    expect(result).toBe("привіт світ");
  });

  it("sends correct request body with Ukrainian language", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: "hello" }] } }],
      }),
    }));

    await spellCheck("helo", "uk", "test-key", "gemini-2.5-flash");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-2.5-flash:generateContent"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Ukrainian"),
      })
    );
  });

  it("sends correct request body with English language", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: "hello" }] } }],
      }),
    }));

    await spellCheck("helo", "en", "test-key", "gemini-2.5-flash");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-2.5-flash:generateContent"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("English"),
      })
    );
  });

  it("returns empty string for empty input", async () => {
    const result = await spellCheck("", "en", "test-key", "gemini-2.5-flash");
    expect(result).toBe("");
  });

  it("throws on API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: "Bad request" } }),
    }));

    await expect(spellCheck("test", "en", "test-key", "gemini-2.5-flash")).rejects.toThrow("Bad request");
  });

  it("builds URL with provided model parameter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: "test" }] } }],
      }),
    }));

    await spellCheck("test", "en", "test-key", "gemini-2.5-pro");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-2.5-pro:generateContent"),
      expect.any(Object)
    );
  });

  it("returns empty string for whitespace-only input", async () => {
    const result = await spellCheck("   ", "en", "test-key", "gemini-2.5-flash");
    expect(result).toBe("");
  });

  it("throws on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    await expect(spellCheck("test", "en", "test-key", "gemini-2.5-flash")).rejects.toThrow("Network failure");
  });
});
