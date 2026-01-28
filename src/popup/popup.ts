import type { Theme } from "../utils/storage";

function applyTheme(theme: Theme): void {
  if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function updateThemeButtons(theme: Theme): void {
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-theme") === theme);
  });
}

export function initPopup(): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="popup-container">
      <h2>Magnacat Translator</h2>

      <div class="field">
        <label for="api-key">API Key</label>
        <input type="password" id="api-key" data-testid="api-key-input" placeholder="Enter Gemini API key" />
      </div>

      <div class="field lang-row">
        <select data-testid="source-lang" id="source-lang">
          <option value="auto">Auto</option>
          <option value="en">English</option>
          <option value="uk">Ukrainian</option>
        </select>
        <button data-testid="swap-btn" id="swap-btn" title="Swap languages">\u21C4</button>
        <select data-testid="target-lang" id="target-lang">
          <option value="uk">Ukrainian</option>
          <option value="en">English</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div class="theme-row" data-testid="theme-toggle">
        <button class="theme-btn" data-testid="theme-light" data-theme="light">Light</button>
        <button class="theme-btn" data-testid="theme-dark" data-theme="dark">Dark</button>
        <button class="theme-btn" data-testid="theme-system" data-theme="system">System</button>
      </div>

      <button data-testid="save-btn" id="save-btn">Save</button>
      <div data-testid="status-msg" id="status-msg"></div>
    </div>
  `;

  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const swapBtn = document.getElementById("swap-btn") as HTMLButtonElement;
  const sourceLang = document.getElementById("source-lang") as HTMLSelectElement;
  const targetLang = document.getElementById("target-lang") as HTMLSelectElement;
  const statusMsg = document.getElementById("status-msg") as HTMLDivElement;

  let currentTheme: Theme = "system";

  // Load current settings
  chrome.runtime.sendMessage({ type: "GET_API_KEY" }, (resp: { success: boolean; data?: string }) => {
    if (resp?.success && resp.data) {
      apiKeyInput.value = resp.data;
    }
  });

  chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (resp: { success: boolean; data?: { sourceLang: string; targetLang: string; theme?: Theme } }) => {
    if (resp?.success && resp.data) {
      sourceLang.value = resp.data.sourceLang;
      targetLang.value = resp.data.targetLang;
      currentTheme = resp.data.theme ?? "system";
      applyTheme(currentTheme);
      updateThemeButtons(currentTheme);
    }
  });

  // Theme toggle handlers
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTheme = btn.getAttribute("data-theme") as Theme;
      applyTheme(currentTheme);
      updateThemeButtons(currentTheme);
    });
  });

  saveBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      statusMsg.textContent = "Please enter a valid API key";
      return;
    }

    chrome.runtime.sendMessage({ type: "SAVE_API_KEY", apiKey: key }, () => {
      chrome.runtime.sendMessage(
        { type: "SAVE_SETTINGS", settings: { sourceLang: sourceLang.value, targetLang: targetLang.value, theme: currentTheme } },
        () => {
          statusMsg.textContent = "Settings saved";
        }
      );
    });
  });

  swapBtn.addEventListener("click", () => {
    const src = sourceLang.value;
    const tgt = targetLang.value;
    sourceLang.value = tgt;
    targetLang.value = src;
  });
}

initPopup();
