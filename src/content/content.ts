import { onTextSelected } from "./selection";
import { monitorInput, replaceInputValue } from "./input-replacer";
import { createTooltip, removeTooltip, showLoading, updateTooltipContent, createTriggerIcon, removeTriggerIcon, setOnCloseCallback } from "./tooltip";
import { getSelectionPosition, getSelectionSourceElement, getSelectedText } from "./selection";
import { playAudio } from "../services/gemini-tts";
import { parseShortcut, matchesShortcut, DEFAULT_SHORTCUT } from "../utils/shortcut";
import type { MessageResponse } from "../background/types";
import type { TooltipCallbacks } from "./tooltip";

let stopCurrentAudio: (() => void) | null = null;

let cachedShortcut = parseShortcut(DEFAULT_SHORTCUT);
chrome.storage.local.get("settings").then((result) => {
  cachedShortcut = parseShortcut(result?.settings?.shortcut ?? DEFAULT_SHORTCUT);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings?.newValue) {
    cachedShortcut = parseShortcut(changes.settings.newValue.shortcut ?? DEFAULT_SHORTCUT);
  }
});

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
      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "TTS", text, voice: "Kore" },
          (resp: MessageResponse) => {
            if (resp?.success && resp.data) {
              const wavBuffer = base64ToArrayBuffer(resp.data as string);
              stopCurrentAudio = playAudio(wavBuffer);
            }
            resolve();
          }
        );
      });
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

  chrome.storage.local.get("settings").then((result) => {
    if (result?.settings?.showTriggerIcon === false) return;
    createTriggerIcon(pos, () => {
      showTranslationTooltip(text, pos, sourceElement);
    });
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

document.addEventListener("keydown", (e) => {
  if (!matchesShortcut(e, cachedShortcut)) return;

  const text = getSelectedText();
  if (!text) return;

  e.preventDefault();
  const pos = getSelectionPosition() ?? { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 };
  const sourceElement = getSelectionSourceElement();
  removeTriggerIcon();
  showTranslationTooltip(text, pos, sourceElement);
});
