import { describe, it, expect, vi, beforeEach } from "vitest";

describe("popup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `<div id="app"></div>`;

    // Setup sendMessage mock for settings/api key retrieval
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: { type: string }, callback?: (resp: unknown) => void) => {
        if (msg.type === "GET_API_KEY") {
          callback?.({ success: true, data: "" });
        } else if (msg.type === "GET_SETTINGS") {
          callback?.({ success: true, data: { sourceLang: "auto", targetLang: "uk" } });
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
});
