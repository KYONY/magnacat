import { GEMINI_BASE_URL } from "../utils/models";

export async function translate(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  model: string
): Promise<string> {
  if (!text.trim()) return "";

  const isHtml = /<[a-z][\s\S]*?>/i.test(text);

  const systemPrompt = isHtml
    ? `You are a translator. Translate the following HTML content from ${sourceLang} to ${targetLang}. Preserve all HTML tags, structure, and formatting exactly as they are. Only translate the text content between tags. Return only the translated HTML, nothing else.`
    : `You are a translator. Translate the following text from ${sourceLang} to ${targetLang}. Return only the translation, nothing else.`;

  const body = {
    system_instruction: {
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    contents: [{ parts: [{ text }] }],
  };

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
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
