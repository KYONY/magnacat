import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetchedModels = {
  translateModels: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
  ttsModels: [
    { id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS" },
    { id: "gemini-2.5-pro-preview-tts", label: "Gemini 2.5 Pro TTS" },
  ],
};

describe("popup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `<div id="app"></div>`;
    document.body.className = "";

    // Mock matchMedia for theme detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Setup sendMessage mock for settings/api key retrieval
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: { type: string }, callback?: (resp: unknown) => void) => {
        if (msg.type === "GET_API_KEY") {
          callback?.({ success: true, data: "" });
        } else if (msg.type === "GET_SETTINGS") {
          callback?.({ success: true, data: { sourceLang: "auto", targetLang: "uk", theme: "system", shortcut: "Ctrl+Shift+X", translateModel: "gemini-2.5-flash", ttsModel: "gemini-2.5-flash-preview-tts" } });
        } else if (msg.type === "SAVE_API_KEY") {
          callback?.({ success: true });
        } else if (msg.type === "SAVE_SETTINGS") {
          callback?.({ success: true });
        } else if (msg.type === "FETCH_MODELS") {
          callback?.({ success: true, data: mockFetchedModels });
        }
      }
    );
  });

  async function loadPopup() {
    const mod = await import("./popup");
    mod.initPopup();
  }

  it("renders API key input field", async () => {
    await loadPopup();
    const input = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.type).toBe("password");
  });

  it("renders save button", async () => {
    await loadPopup();
    const btn = document.querySelector("[data-testid='save-btn']");
    expect(btn).not.toBeNull();
  });

  it("save button stores API key via message to service worker", async () => {
    await loadPopup();
    const input = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    const btn = document.querySelector("[data-testid='save-btn']") as HTMLButtonElement;

    input.value = "new-api-key";
    btn.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "SAVE_API_KEY", apiKey: "new-api-key" },
      expect.any(Function)
    );
  });

  it("displays source and target language selectors", async () => {
    await loadPopup();
    const sourceLang = document.querySelector("[data-testid='source-lang']");
    const targetLang = document.querySelector("[data-testid='target-lang']");
    expect(sourceLang).not.toBeNull();
    expect(targetLang).not.toBeNull();
  });

  it("swap button swaps source and target language", async () => {
    await loadPopup();
    const sourceLang = document.querySelector("[data-testid='source-lang']") as HTMLSelectElement;
    const targetLang = document.querySelector("[data-testid='target-lang']") as HTMLSelectElement;

    sourceLang.value = "en";
    targetLang.value = "uk";

    const swapBtn = document.querySelector("[data-testid='swap-btn']") as HTMLButtonElement;
    swapBtn.click();

    expect(sourceLang.value).toBe("uk");
    expect(targetLang.value).toBe("en");
  });

  it("shows validation state for empty API key", async () => {
    await loadPopup();
    const input = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    const btn = document.querySelector("[data-testid='save-btn']") as HTMLButtonElement;

    input.value = "";
    btn.click();

    const status = document.querySelector("[data-testid='status-msg']");
    expect(status?.textContent).toContain("enter");
  });

  it("renders theme toggle with three buttons", async () => {
    await loadPopup();
    const toggle = document.querySelector("[data-testid='theme-toggle']");
    expect(toggle).not.toBeNull();
    expect(document.querySelector("[data-testid='theme-light']")).not.toBeNull();
    expect(document.querySelector("[data-testid='theme-dark']")).not.toBeNull();
    expect(document.querySelector("[data-testid='theme-system']")).not.toBeNull();
  });

  it("clicking dark theme button adds dark class to body", async () => {
    await loadPopup();
    const darkBtn = document.querySelector("[data-testid='theme-dark']") as HTMLButtonElement;
    darkBtn.click();
    expect(document.body.classList.contains("dark")).toBe(true);
  });

  it("clicking light theme button removes dark class from body", async () => {
    await loadPopup();
    document.body.classList.add("dark");
    const lightBtn = document.querySelector("[data-testid='theme-light']") as HTMLButtonElement;
    lightBtn.click();
    expect(document.body.classList.contains("dark")).toBe(false);
  });

  it("renders show-icon toggle, checked by default", async () => {
    await loadPopup();
    const toggle = document.querySelector("[data-testid='show-icon-toggle']") as HTMLInputElement;
    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe("checkbox");
    expect(toggle.checked).toBe(true);
  });

  it("includes showTriggerIcon in save payload", async () => {
    await loadPopup();
    const input = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    const toggle = document.querySelector("[data-testid='show-icon-toggle']") as HTMLInputElement;
    const btn = document.querySelector("[data-testid='save-btn']") as HTMLButtonElement;

    input.value = "test-key";
    toggle.checked = false;
    btn.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "SAVE_SETTINGS", settings: expect.objectContaining({ showTriggerIcon: false }) },
      expect.any(Function)
    );
  });

  it("renders shortcut input as readonly with default value", async () => {
    await loadPopup();
    const shortcutInput = document.querySelector("[data-testid='shortcut-input']") as HTMLInputElement;
    expect(shortcutInput).not.toBeNull();
    expect(shortcutInput.readOnly).toBe(true);
    expect(shortcutInput.value).toBe("Ctrl+Shift+X");
  });

  it("captures key combo on keydown in shortcut input", async () => {
    await loadPopup();
    const shortcutInput = document.querySelector("[data-testid='shortcut-input']") as HTMLInputElement;

    shortcutInput.focus();
    shortcutInput.dispatchEvent(new KeyboardEvent("keydown", { key: "t", altKey: true, bubbles: true }));

    expect(shortcutInput.value).toBe("Alt+T");
  });

  it("includes shortcut in save payload", async () => {
    await loadPopup();
    const apiKeyInput = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    const btn = document.querySelector("[data-testid='save-btn']") as HTMLButtonElement;

    apiKeyInput.value = "test-key";
    btn.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "SAVE_SETTINGS", settings: expect.objectContaining({ shortcut: "Ctrl+Shift+X" }) },
      expect.any(Function)
    );
  });

  it("clear button resets shortcut to default", async () => {
    await loadPopup();
    const shortcutInput = document.querySelector("[data-testid='shortcut-input']") as HTMLInputElement;
    const clearBtn = document.querySelector("[data-testid='shortcut-clear']") as HTMLButtonElement;

    // First set a custom shortcut
    shortcutInput.focus();
    shortcutInput.dispatchEvent(new KeyboardEvent("keydown", { key: "t", altKey: true, bubbles: true }));
    expect(shortcutInput.value).toBe("Alt+T");

    // Clear it
    clearBtn.click();
    expect(shortcutInput.value).toBe("Ctrl+Shift+X");
  });

  it("renders translate model select with fetched models", async () => {
    await loadPopup();
    const select = document.querySelector("[data-testid='translate-model']") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("gemini-2.5-flash");
    expect(select.options.length).toBe(3);
    expect(select.options[0].textContent).toBe("Gemini 2.5 Flash");
    expect(select.options[1].textContent).toBe("Gemini 2.5 Pro");
    expect(select.options[2].textContent).toBe("Gemini 2.0 Flash");
  });

  it("renders TTS model select with fetched models", async () => {
    await loadPopup();
    const select = document.querySelector("[data-testid='tts-model']") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("gemini-2.5-flash-preview-tts");
    expect(select.options.length).toBe(2);
    expect(select.options[0].textContent).toBe("Gemini 2.5 Flash TTS");
    expect(select.options[1].textContent).toBe("Gemini 2.5 Pro TTS");
  });

  it("shows fallback option when FETCH_MODELS fails", async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: { type: string }, callback?: (resp: unknown) => void) => {
        if (msg.type === "GET_API_KEY") {
          callback?.({ success: true, data: "" });
        } else if (msg.type === "GET_SETTINGS") {
          callback?.({ success: true, data: { sourceLang: "auto", targetLang: "uk", theme: "system", shortcut: "Ctrl+Shift+X", translateModel: "gemini-2.5-flash", ttsModel: "gemini-2.5-flash-preview-tts" } });
        } else if (msg.type === "FETCH_MODELS") {
          callback?.({ success: false, error: "No API key" });
        } else {
          callback?.({ success: true });
        }
      }
    );

    await loadPopup();
    const translateSelect = document.querySelector("[data-testid='translate-model']") as HTMLSelectElement;
    const ttsSelect = document.querySelector("[data-testid='tts-model']") as HTMLSelectElement;

    expect(translateSelect.options.length).toBe(1);
    expect(translateSelect.value).toBe("gemini-2.5-flash");
    expect(ttsSelect.options.length).toBe(1);
    expect(ttsSelect.value).toBe("gemini-2.5-flash-preview-tts");
  });

  it("includes model selections in save payload", async () => {
    await loadPopup();
    const apiKeyInput = document.querySelector("[data-testid='api-key-input']") as HTMLInputElement;
    const translateModel = document.querySelector("[data-testid='translate-model']") as HTMLSelectElement;
    const ttsModel = document.querySelector("[data-testid='tts-model']") as HTMLSelectElement;
    const btn = document.querySelector("[data-testid='save-btn']") as HTMLButtonElement;

    apiKeyInput.value = "test-key";
    translateModel.value = "gemini-2.5-pro";
    ttsModel.value = "gemini-2.5-pro-preview-tts";
    btn.click();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "SAVE_SETTINGS", settings: expect.objectContaining({ translateModel: "gemini-2.5-pro", ttsModel: "gemini-2.5-pro-preview-tts" }) },
      expect.any(Function)
    );
  });
});
