export type Language = "en" | "uk" | "unknown";

const CYRILLIC_RANGE = /[\u0400-\u04FF]/;
const LATIN_RANGE = /[A-Za-z]/;

export function detectLanguage(text: string): Language {
  const hasCyrillic = CYRILLIC_RANGE.test(text);
  const hasLatin = LATIN_RANGE.test(text);

  if (hasCyrillic) return "uk";
  if (hasLatin) return "en";
  return "unknown";
}
