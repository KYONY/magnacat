import type { Message, MessageResponse } from "./types";
import { translate } from "../services/gemini-translate";
import { synthesizeSpeech } from "../services/gemini-tts";
import { detectLanguage } from "../utils/language-detect";
import { getSettings, saveSettings, getApiKey, saveApiKey } from "../utils/storage";
import { DEFAULT_TRANSLATE_MODEL, DEFAULT_TTS_MODEL } from "../utils/models";
import { fetchAvailableModels } from "../services/gemini-models";
import { spellCheck } from "../services/gemini-spellcheck";

export async function handleMessage(message: Message): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case "TRANSLATE": {
        const apiKey = await getApiKey();
        const settings = await getSettings();
        const data = await translate(message.text, message.from, message.to, apiKey!, settings.translateModel ?? DEFAULT_TRANSLATE_MODEL);
        return { success: true, data };
      }
      case "TTS": {
        const apiKey = await getApiKey();
        const settings = await getSettings();
        const wavBuffer = await synthesizeSpeech(message.text, message.voice, apiKey!, settings.ttsModel ?? DEFAULT_TTS_MODEL);
        const bytes = new Uint8Array(wavBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const data = btoa(binary);
        return { success: true, data };
      }
      case "DETECT_LANG": {
        const data = detectLanguage(message.text);
        return { success: true, data };
      }
      case "GET_SETTINGS": {
        const data = await getSettings();
        return { success: true, data };
      }
      case "SAVE_SETTINGS": {
        await saveSettings(message.settings);
        return { success: true };
      }
      case "GET_API_KEY": {
        const data = await getApiKey();
        return { success: true, data };
      }
      case "SAVE_API_KEY": {
        await saveApiKey(message.apiKey);
        return { success: true };
      }
      case "FETCH_MODELS": {
        const apiKey = await getApiKey();
        if (!apiKey) {
          return { success: true, data: { translateModels: [], ttsModels: [] } };
        }
        const data = await fetchAvailableModels(apiKey);
        return { success: true, data };
      }
      case "SPELLCHECK": {
        const apiKey = await getApiKey();
        const settings = await getSettings();
        const data = await spellCheck(message.text, message.lang, apiKey!, settings.translateModel ?? DEFAULT_TRANSLATE_MODEL);
        return { success: true, data };
      }
      default:
        return { success: false, error: `Unknown message type: ${(message as { type: string }).type}` };
    }
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
