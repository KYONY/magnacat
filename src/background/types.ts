import type { Settings } from "../utils/storage";

export type MessageType =
  | "TRANSLATE"
  | "TTS"
  | "DETECT_LANG"
  | "GET_SETTINGS"
  | "SAVE_SETTINGS"
  | "GET_API_KEY"
  | "SAVE_API_KEY"
  | "FETCH_MODELS";

export interface TranslateMessage {
  type: "TRANSLATE";
  text: string;
  from: string;
  to: string;
}

export interface TtsMessage {
  type: "TTS";
  text: string;
  voice: string;
}

export interface DetectLangMessage {
  type: "DETECT_LANG";
  text: string;
}

export interface GetSettingsMessage {
  type: "GET_SETTINGS";
}

export interface SaveSettingsMessage {
  type: "SAVE_SETTINGS";
  settings: Settings;
}

export interface GetApiKeyMessage {
  type: "GET_API_KEY";
}

export interface SaveApiKeyMessage {
  type: "SAVE_API_KEY";
  apiKey: string;
}

export interface FetchModelsMessage {
  type: "FETCH_MODELS";
}

export type Message =
  | TranslateMessage
  | TtsMessage
  | DetectLangMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | GetApiKeyMessage
  | SaveApiKeyMessage
  | FetchModelsMessage;

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
