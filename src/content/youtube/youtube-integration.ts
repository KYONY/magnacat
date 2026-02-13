import { isYouTubePage, findSubtitleContainer, onSubtitlesToggled } from "./youtube-detector";
import { observeSubtitles } from "./subtitle-processor";
import { initWordSelector, cleanupWordSelector, type WordSelection } from "./word-selector";
import { pauseVideo, resumeVideo, resetVideoState } from "./video-controller";
import { injectSubtitleStyles, removeSubtitleStyles } from "./subtitle-styles";
import { createTooltip, removeTooltip, showLoading, updateTooltipContent, setOnCloseCallback } from "../tooltip";
import { playAudio } from "../../services/gemini-tts";
import type { MessageResponse } from "../../background/types";

let cleanupSubtitleObserver: (() => void) | null = null;
let cleanupSubtitleToggle: (() => void) | null = null;
let stopCurrentAudio: (() => void) | null = null;
let active = false;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function handleWordSelected(selection: WordSelection): void {
  pauseVideo();

  const pos = { x: window.innerWidth / 2 - 150, y: window.innerHeight - 200 };

  const callbacks = {
    onTts: (text: string) => {
      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "TTS", text, voice: "Kore" },
          (resp: MessageResponse) => {
            if (resp?.success && resp.data) {
              const wavBuffer = base64ToArrayBuffer(resp.data as string);
              stopCurrentAudio = playAudio(wavBuffer);
            }
            resolve();
          },
        );
      });
    },
    onCopy: (translatedText: string) => {
      navigator.clipboard.writeText(translatedText).catch(() => {});
    },
  };

  createTooltip(pos, "", callbacks);
  setOnCloseCallback(() => {
    stopCurrentAudio?.();
    stopCurrentAudio = null;
    resumeVideo();
    resetVideoState();
  });
  showLoading();

  chrome.runtime.sendMessage(
    { type: "DETECT_LANG", text: selection.text },
    (langResp: MessageResponse) => {
      const lang = langResp?.data as string;
      const from = lang === "uk" ? "uk" : "en";
      const to = from === "uk" ? "en" : "uk";

      chrome.runtime.sendMessage(
        { type: "TRANSLATE", text: selection.text, from, to, context: selection.context },
        (transResp: MessageResponse) => {
          if (transResp?.success) {
            updateTooltipContent(transResp.data as string);
          } else {
            updateTooltipContent("Translation error");
          }
        },
      );
    },
  );
}

function handleSelectionCleared(): void {
  removeTooltip();
}

function attachToContainer(container: HTMLElement): void {
  cleanupSubtitleObserver?.();
  cleanupWordSelector();

  injectSubtitleStyles();
  cleanupSubtitleObserver = observeSubtitles(container);
  initWordSelector(container, handleWordSelected, handleSelectionCleared);
}

function detachFromContainer(): void {
  cleanupSubtitleObserver?.();
  cleanupSubtitleObserver = null;
  cleanupWordSelector();
  removeTooltip();
  resetVideoState();
}

export function initYouTubeIntegration(): void {
  if (!isYouTubePage()) return;
  if (active) return;
  active = true;

  const container = findSubtitleContainer();
  if (container) {
    attachToContainer(container);
  }

  cleanupSubtitleToggle = onSubtitlesToggled((newContainer) => {
    if (newContainer) {
      attachToContainer(newContainer);
    } else {
      detachFromContainer();
    }
  });
}

export function destroyYouTubeIntegration(): void {
  detachFromContainer();
  removeSubtitleStyles();
  cleanupSubtitleToggle?.();
  cleanupSubtitleToggle = null;
  active = false;
}

export function isYouTubeIntegrationActive(): boolean {
  return active;
}
