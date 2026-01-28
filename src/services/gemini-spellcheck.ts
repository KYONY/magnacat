import { GEMINI_BASE_URL } from "../utils/models";

export async function spellCheck(
  text: string,
  lang: string,
  apiKey: string,
  model: string
): Promise<string> {
  if (!text.trim()) return "";

  const langName = lang === "uk" ? "Ukrainian" : "English";

  const body = {
    system_instruction: {
      parts: [
        {
          text: `You are a spelling and grammar checker for ${langName}. Fix any spelling and grammar errors in the following text. Return ONLY the corrected text, nothing else. If the text is already correct, return it unchanged. Do not add explanations or comments.`,
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
