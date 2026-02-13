import { describe, it, expect, vi, beforeEach } from "vitest";
import { translate } from "./gemini-translate";
import { GEMINI_BASE_URL } from "../utils/models";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function geminiResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
  };
}

describe("translate", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("translates English to Ukrainian", async () => {
    mockFetch.mockResolvedValueOnce(geminiResponse("привіт"));
    const result = await translate("hello", "en", "uk", "test-key", "gemini-2.5-flash");
    expect(result).toBe("привіт");
  });

  it("translates Ukrainian to English", async () => {
    mockFetch.mockResolvedValueOnce(geminiResponse("hello"));
    const result = await translate("привіт", "uk", "en", "test-key", "gemini-2.5-flash");
    expect(result).toBe("hello");
  });

  it("sends correct request to Gemini API", async () => {
    mockFetch.mockResolvedValueOnce(geminiResponse("world"));
    await translate("world", "en", "uk", "my-api-key", "gemini-2.5-pro");

    expect(mockFetch).toHaveBeenCalledWith(
      `${GEMINI_BASE_URL}/gemini-2.5-pro:generateContent?key=my-api-key`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      })
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contents).toBeDefined();
    expect(body.contents[0].parts[0].text).toContain("world");
  });

  it("throws on API error (4xx/5xx)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ error: { message: "Invalid API key" } }),
    });

    await expect(translate("hello", "en", "uk", "bad-key", "gemini-2.5-flash")).rejects.toThrow();
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));
    await expect(translate("hello", "en", "uk", "key", "gemini-2.5-flash")).rejects.toThrow("Network failure");
  });

  it("returns empty string for empty input", async () => {
    const result = await translate("", "en", "uk", "key", "gemini-2.5-flash");
    expect(result).toBe("");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses HTML-aware prompt when input contains HTML tags", async () => {
    mockFetch.mockResolvedValueOnce(geminiResponse("<p>привіт</p>"));
    await translate("<p>hello</p>", "en", "uk", "key", "gemini-2.5-flash");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.system_instruction.parts[0].text).toContain("HTML");
    expect(body.system_instruction.parts[0].text).toContain("Preserve all HTML tags");
  });

  it("uses plain text prompt when input has no HTML tags", async () => {
    mockFetch.mockResolvedValueOnce(geminiResponse("привіт"));
    await translate("hello", "en", "uk", "key", "gemini-2.5-flash");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.system_instruction.parts[0].text).not.toContain("HTML");
  });

  it("returns empty string for whitespace-only input", async () => {
    const result = await translate("   ", "en", "uk", "key", "gemini-2.5-flash");
    expect(result).toBe("");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
