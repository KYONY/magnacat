export interface TooltipPosition {
  x: number;
  y: number;
}

export interface TooltipCallbacks {
  onTts?: (text: string) => void;
  onCopy?: (text: string) => void;
  onReplace?: (text: string) => void;
}

const TOOLTIP_ID = "magnacat-tooltip";
const TRIGGER_ID = "magnacat-trigger";

let currentHost: HTMLElement | null = null;
let currentTrigger: HTMLElement | null = null;

function getTooltipCSS(): string {
  return `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }
    .tooltip {
      background: #fff;
      color: #1a1a1a;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      max-width: 360px;
      word-wrap: break-word;
    }
    .translation-text {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 6px;
    }
    .btn {
      border: none;
      background: #f0f0f0;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover {
      background: #e0e0e0;
    }
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #555;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-color-scheme: dark) {
      :host(:not([data-theme="light"])) .tooltip {
        background: #2a2a2a;
        color: #e0e0e0;
        border-color: #444;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }
      :host(:not([data-theme="light"])) .btn {
        background: #3a3a3a;
        color: #e0e0e0;
      }
      :host(:not([data-theme="light"])) .btn:hover {
        background: #4a4a4a;
      }
      :host(:not([data-theme="light"])) .spinner {
        border-color: #555;
        border-top-color: #ccc;
      }
    }

    :host([data-theme="dark"]) .tooltip {
      background: #2a2a2a;
      color: #e0e0e0;
      border-color: #444;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    :host([data-theme="dark"]) .btn {
      background: #3a3a3a;
      color: #e0e0e0;
    }
    :host([data-theme="dark"]) .btn:hover {
      background: #4a4a4a;
    }
    :host([data-theme="dark"]) .spinner {
      border-color: #555;
      border-top-color: #ccc;
    }
  `;
}

export function createTooltip(position: TooltipPosition, translation: string, callbacks?: TooltipCallbacks): void {
  removeTooltip();

  const host = document.createElement("div");
  host.id = TOOLTIP_ID;
  const shadow = host.attachShadow({ mode: "open" });

  // Apply theme attribute from storage
  try {
    chrome.storage.local.get("settings", (result) => {
      const theme = result?.settings?.theme;
      if (theme && theme !== "system") {
        host.setAttribute("data-theme", theme);
      }
    });
  } catch {
    // Not in extension context (tests)
  }

  const style = document.createElement("style");
  style.textContent = getTooltipCSS();
  shadow.appendChild(style);

  const container = document.createElement("div");
  container.className = "tooltip";

  const textEl = document.createElement("div");
  textEl.className = "translation-text";
  textEl.setAttribute("data-testid", "translation-text");
  textEl.textContent = translation;
  container.appendChild(textEl);

  const actions = document.createElement("div");
  actions.className = "actions";

  const ttsBtn = document.createElement("button");
  ttsBtn.className = "btn";
  ttsBtn.setAttribute("data-testid", "tts-btn");
  ttsBtn.textContent = "\u{1F50A}";
  ttsBtn.title = "Listen";
  if (callbacks?.onTts) {
    const onTts = callbacks.onTts;
    ttsBtn.addEventListener("click", () => onTts(textEl.textContent ?? ""));
  }
  actions.appendChild(ttsBtn);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.setAttribute("data-testid", "copy-btn");
  copyBtn.textContent = "\u{1F4CB}";
  copyBtn.title = "Copy";
  if (callbacks?.onCopy) {
    const onCopy = callbacks.onCopy;
    copyBtn.addEventListener("click", () => onCopy(textEl.textContent ?? ""));
  }
  actions.appendChild(copyBtn);

  if (callbacks?.onReplace) {
    const onReplace = callbacks.onReplace;
    const replaceBtn = document.createElement("button");
    replaceBtn.className = "btn";
    replaceBtn.setAttribute("data-testid", "replace-btn");
    replaceBtn.textContent = "\u21BB";
    replaceBtn.title = "Replace";
    replaceBtn.addEventListener("click", () => onReplace(textEl.textContent ?? ""));
    actions.appendChild(replaceBtn);
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn";
  closeBtn.setAttribute("data-testid", "close-btn");
  closeBtn.textContent = "\u2715";
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", () => removeTooltip());
  actions.appendChild(closeBtn);

  container.appendChild(actions);
  shadow.appendChild(container);

  host.style.left = `${position.x}px`;
  host.style.top = `${position.y}px`;

  document.body.appendChild(host);
  currentHost = host;
}

export function removeTooltip(): void {
  if (currentHost) {
    currentHost.remove();
    currentHost = null;
    return;
  }
  const existing = document.getElementById(TOOLTIP_ID);
  existing?.remove();
}

export function updateTooltipContent(text: string): void {
  const host = document.getElementById(TOOLTIP_ID) as HTMLElement | null;
  if (!host?.shadowRoot) return;
  const el = host.shadowRoot.querySelector("[data-testid='translation-text']");
  if (el) el.textContent = text;

  const loading = host.shadowRoot.querySelector("[data-testid='loading']");
  loading?.remove();
}

export function showLoading(): void {
  const host = document.getElementById(TOOLTIP_ID) as HTMLElement | null;
  if (!host?.shadowRoot) return;

  const textEl = host.shadowRoot.querySelector("[data-testid='translation-text']");
  if (textEl) textEl.textContent = "";

  const existing = host.shadowRoot.querySelector("[data-testid='loading']");
  if (existing) return;

  const container = host.shadowRoot.querySelector(".tooltip");
  if (!container) return;

  const loading = document.createElement("div");
  loading.className = "loading";
  loading.setAttribute("data-testid", "loading");

  const spinner = document.createElement("div");
  spinner.className = "spinner";
  loading.appendChild(spinner);

  const label = document.createElement("span");
  label.textContent = "Translating...";
  loading.appendChild(label);

  container.insertBefore(loading, container.firstChild);
}

export function createTriggerIcon(position: TooltipPosition, onClick: () => void): void {
  removeTriggerIcon();

  const host = document.createElement("div");
  host.id = TRIGGER_ID;
  const shadow = host.attachShadow({ mode: "open" });

  try {
    chrome.storage.local.get("settings", (result) => {
      const theme = result?.settings?.theme;
      if (theme && theme !== "system") {
        host.setAttribute("data-theme", theme);
      }
    });
  } catch {
    // Not in extension context (tests)
  }

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
    }
    .trigger {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #e0e0e0;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .trigger:hover {
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    }
    .trigger img {
      width: 20px;
      height: 20px;
    }

    @media (prefers-color-scheme: dark) {
      :host(:not([data-theme="light"])) .trigger {
        background: #2a2a2a;
        border-color: #444;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      }
      :host(:not([data-theme="light"])) .trigger:hover {
        box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      }
    }

    :host([data-theme="dark"]) .trigger {
      background: #2a2a2a;
      border-color: #444;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    :host([data-theme="dark"]) .trigger:hover {
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    }
  `;
  shadow.appendChild(style);

  const button = document.createElement("button");
  button.className = "trigger";
  button.setAttribute("data-testid", "trigger-btn");

  const img = document.createElement("img");
  try {
    img.src = chrome.runtime.getURL("icons/icon-48.png");
  } catch {
    // Not in extension context (tests)
    img.src = "icons/icon-48.png";
  }
  img.alt = "Translate";
  button.appendChild(img);

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
    removeTriggerIcon();
  });

  shadow.appendChild(button);

  host.style.left = `${position.x}px`;
  host.style.top = `${position.y}px`;

  document.body.appendChild(host);
  currentTrigger = host;
}

export function removeTriggerIcon(): void {
  if (currentTrigger) {
    currentTrigger.remove();
    currentTrigger = null;
    return;
  }
  const existing = document.getElementById(TRIGGER_ID);
  existing?.remove();
}
