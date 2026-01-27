import { onTextSelected } from "./selection";
import { monitorInput } from "./input-replacer";
import { createTooltip, showLoading, updateTooltipContent } from "./tooltip";
import { getSelectionPosition } from "./selection";
import type { MessageResponse } from "../background/types";

function handleSelectedText(text: string): void {
  const pos = getSelectionPosition();
  if (!pos) return;

  createTooltip(pos, "");
  showLoading();

  chrome.runtime.sendMessage(
    { type: "DETECT_LANG", text },
    (langResp: MessageResponse) => {
      const lang = langResp?.data as string;
      const from = lang === "uk" ? "uk" : "en";
      const to = from === "uk" ? "en" : "uk";

      chrome.runtime.sendMessage(
        { type: "TRANSLATE", text, from, to },
        (transResp: MessageResponse) => {
          if (transResp?.success) {
            updateTooltipContent(transResp.data as string);
          } else {
            updateTooltipContent("Translation error");
          }
        }
      );
    }
  );
}

function isInputElement(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA";
}

function monitorExistingInputs(): void {
  const inputs = document.querySelectorAll("input, textarea, [contenteditable='true']");
  inputs.forEach((el) => monitorInput(el as HTMLElement));
}

function observeDynamicInputs(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (isInputElement(node) || node.getAttribute("contenteditable") === "true") {
          monitorInput(node);
        }
        const nested = node.querySelectorAll("input, textarea, [contenteditable='true']");
        nested.forEach((el) => monitorInput(el as HTMLElement));
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

onTextSelected(handleSelectedText);
monitorExistingInputs();
observeDynamicInputs();
