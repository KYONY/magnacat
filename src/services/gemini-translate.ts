export const GEMINI_TRANSLATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function translate(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<string> {
  if (!text.trim()) return "";

  const body = {
    system_instruction: {
      parts: [
        {
          text: `You are a translator. Translate the following text from ${sourceLang} to ${targetLang}. Return only the translation, nothing else.`,
        },
      ],
    },
    contents: [{ parts: [{ text }] }],
  };

  const response = await fetch(`${GEMINI_TRANSLATE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message ?? `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
