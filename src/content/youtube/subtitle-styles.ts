const STYLE_ID = "magnacat-subtitle-styles";

const CSS = `
.mc-word {
  cursor: pointer !important;
  user-select: none !important;
  border-radius: 2px;
  padding: 1px 2px;
  margin: 0 -2px;
  transition: background-color 0.15s ease;
  position: relative;
  display: inline;
}

.mc-word:hover,
.mc-word.mc-hover {
  background-color: rgba(255, 255, 100, 0.35) !important;
}

.mc-word.mc-selected {
  background-color: rgba(255, 255, 100, 0.65) !important;
}
`;

export function injectSubtitleStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function removeSubtitleStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
