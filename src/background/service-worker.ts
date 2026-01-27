import { handleMessage } from "./handlers";
import type { Message } from "./types";

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // keep message channel open for async response
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "magnacat-translate",
    title: "Translate with Magnacat",
    contexts: ["selection"],
  });
});
