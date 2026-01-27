import { describe, it, expect } from "vitest";
import { detectLanguage } from "./language-detect";

describe("detectLanguage", () => {
  it('returns "en" for English text', () => {
    expect(detectLanguage("hello world")).toBe("en");
  });

  it('returns "en" for longer English text', () => {
    expect(detectLanguage("The quick brown fox jumps over the lazy dog")).toBe("en");
  });

  it('returns "uk" for Ukrainian text', () => {
    expect(detectLanguage("привіт світ")).toBe("uk");
  });

  it('returns "uk" for longer Ukrainian text', () => {
    expect(detectLanguage("Як справи? Все добре, дякую")).toBe("uk");
  });

  it('returns "uk" when cyrillic characters are present in mixed text', () => {
    expect(detectLanguage("hello привіт")).toBe("uk");
  });

  it('returns "unknown" for empty string', () => {
    expect(detectLanguage("")).toBe("unknown");
  });

  it('returns "unknown" for only numbers and symbols', () => {
    expect(detectLanguage("123!@#")).toBe("unknown");
  });

  it('returns "unknown" for whitespace only', () => {
    expect(detectLanguage("   ")).toBe("unknown");
  });

  it('returns "en" for text with numbers mixed with English', () => {
    expect(detectLanguage("hello 123 world")).toBe("en");
  });

  it('returns "uk" for text with numbers mixed with Ukrainian', () => {
    expect(detectLanguage("привіт 123 світ")).toBe("uk");
  });
});
