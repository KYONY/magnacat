import { describe, it, expect, vi, beforeEach } from "vitest";

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
          callback?.({ success: true, data: { sourceLang: "auto", targetLang: "uk", theme: "system" } });
        } else if (msg.type === "SAVE_API_KEY") {
          callback?.({ success: true });
        } else if (msg.type === "SAVE_SETTINGS") {
          callback?.({ success: true });
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
});
