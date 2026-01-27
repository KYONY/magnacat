import { handleMessage } from "./handlers";
import { setupContextMenu, handleContextMenuClick } from "./context-menu";
import type { Message } from "./types";

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // keep message channel open for async response
});

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenuClick(info).then((result) => {
    if (result?.success && tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_TRANSLATION",
        data: result.data,
      });
    }
  });
});
