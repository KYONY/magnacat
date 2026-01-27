export interface TooltipPosition {
  x: number;
  y: number;
}

const TOOLTIP_ID = "magnacat-tooltip";

let currentHost: HTMLElement | null = null;

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
  `;
}

export function createTooltip(position: TooltipPosition, translation: string): void {
  removeTooltip();

  const host = document.createElement("div");
  host.id = TOOLTIP_ID;
  const shadow = host.attachShadow({ mode: "open" });

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
  actions.appendChild(ttsBtn);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.setAttribute("data-testid", "copy-btn");
  copyBtn.textContent = "\u{1F4CB}";
  copyBtn.title = "Copy";
  actions.appendChild(copyBtn);

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn";
  closeBtn.setAttribute("data-testid", "close-btn");
  closeBtn.textContent = "\u2715";
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", removeTooltip);
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
