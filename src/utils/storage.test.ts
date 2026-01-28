import { describe, it, expect, beforeEach } from "vitest";
import { resetChromeStorage } from "../test-setup";
import { saveApiKey, getApiKey, saveSettings, getSettings, type Settings } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    resetChromeStorage();
  });

  describe("saveApiKey", () => {
    it("stores API key to chrome.storage.local", async () => {
      await saveApiKey("test-api-key-123");
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: "test-api-key-123" });
    });
  });

  describe("getApiKey", () => {
    it("retrieves API key from chrome.storage.local", async () => {
      await saveApiKey("my-key");
      const key = await getApiKey();
      expect(key).toBe("my-key");
    });

    it("returns null when no API key is stored", async () => {
      const key = await getApiKey();
      expect(key).toBeNull();
    });
  });

  describe("saveSettings", () => {
    it("stores settings to chrome.storage.local", async () => {
      const settings: Settings = { sourceLang: "uk", targetLang: "en", theme: "dark", showTriggerIcon: true, shortcut: "Alt+T" };
      await saveSettings(settings);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings });
    });
  });

  describe("getSettings", () => {
    it("returns saved settings", async () => {
      const settings: Settings = { sourceLang: "en", targetLang: "uk", theme: "light", showTriggerIcon: true, shortcut: "Ctrl+Shift+X" };
      await saveSettings(settings);
      const result = await getSettings();
      expect(result).toEqual(settings);
    });

    it("returns defaults when no settings stored", async () => {
      const result = await getSettings();
      expect(result).toEqual({ sourceLang: "auto", targetLang: "uk", theme: "system", showTriggerIcon: true, shortcut: "Ctrl+Shift+X" });
    });

    it("includes theme field with default value system", async () => {
      const result = await getSettings();
      expect(result.theme).toBe("system");
    });
  });
});
