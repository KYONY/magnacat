import { handleMessage } from "./handlers";
import { setupContextMenu } from "./context-menu";
import type { Message } from "./types";

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // keep message channel open for async response
});

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "magnacat-translate") return;
  if (!info.selectionText || !tab?.id) return;

  chrome.tabs.sendMessage(tab.id, {
    type: "CONTEXT_MENU_TRANSLATE",
    text: info.selectionText,
  }).catch(() => {
    // Content script not available on this page
  });
});
