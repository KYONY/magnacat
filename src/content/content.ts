import { onTextSelected } from "./selection";
import { monitorInput, replaceInputValue } from "./input-replacer";
import { createTooltip, removeTooltip, showLoading, updateTooltipContent, createTriggerIcon, removeTriggerIcon, setOnCloseCallback } from "./tooltip";
import { getSelectionPosition, getSelectionSourceElement } from "./selection";
import { playAudio } from "../services/gemini-tts";
import type { MessageResponse } from "../background/types";
import type { TooltipCallbacks } from "./tooltip";

let stopCurrentAudio: (() => void) | null = null;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function showTranslationTooltip(text: string, pos: { x: number; y: number }, sourceElement: HTMLElement | null): void {
  const callbacks: TooltipCallbacks = {
    onTts: () => {
      chrome.runtime.sendMessage(
        { type: "TTS", text, voice: "Kore" },
        (resp: MessageResponse) => {
          if (resp?.success && resp.data) {
            const wavBuffer = base64ToArrayBuffer(resp.data as string);
            stopCurrentAudio = playAudio(wavBuffer);
          }
        }
      );
    },
    onCopy: (translatedText: string) => {
      navigator.clipboard.writeText(translatedText).catch(() => {
        // Clipboard write failed silently
      });
    },
  };

  if (sourceElement) {
    callbacks.onReplace = (translatedText: string) => {
      replaceInputValue(sourceElement, translatedText);
      removeTooltip();
    };
  }

  createTooltip(pos, "", callbacks);
  setOnCloseCallback(() => {
    stopCurrentAudio?.();
    stopCurrentAudio = null;
  });
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

function handleSelectedText(text: string): void {
  if (document.getElementById("magnacat-trigger")) return;

  const pos = getSelectionPosition();
  if (!pos) return;

  const sourceElement = getSelectionSourceElement();

  createTriggerIcon(pos, () => {
    showTranslationTooltip(text, pos, sourceElement);
  });
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

document.addEventListener("mousedown", (e) => {
  const trigger = document.getElementById("magnacat-trigger");
  if (trigger && !trigger.contains(e.target as Node)) {
    removeTriggerIcon();
  }
});

chrome.runtime.onMessage.addListener((message: { type: string; text?: string }) => {
  if (message.type === "CONTEXT_MENU_TRANSLATE" && message.text) {
    const pos = getSelectionPosition() ?? { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 };
    const sourceElement = getSelectionSourceElement();
    removeTriggerIcon();
    showTranslationTooltip(message.text, pos, sourceElement);
  }
});
