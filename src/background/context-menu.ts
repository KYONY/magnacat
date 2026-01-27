import { handleMessage } from "./handlers";
import type { MessageResponse } from "./types";

export function setupContextMenu(): void {
  chrome.contextMenus.create({
    id: "magnacat-translate",
    title: "Translate with Magnacat",
    contexts: ["selection"],
  });
}

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData
): Promise<MessageResponse | null> {
  if (info.menuItemId !== "magnacat-translate") return null;
  if (!info.selectionText) return null;

  const text = info.selectionText;

  const langResp = await handleMessage({ type: "DETECT_LANG", text });
  const lang = langResp.data as string;
  const from = lang === "uk" ? "uk" : "en";
  const to = from === "uk" ? "en" : "uk";

  return handleMessage({ type: "TRANSLATE", text, from, to });
}
