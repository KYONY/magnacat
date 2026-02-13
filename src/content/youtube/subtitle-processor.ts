const PROCESSED_ATTR = "data-mc-processed";
const WORD_CLASS = "mc-word";

export function wrapWordsInSegment(segment: HTMLElement): void {
  if (segment.getAttribute(PROCESSED_ATTR)) return;

  const text = segment.textContent ?? "";
  if (!text.trim()) return;

  const parts = text.split(/(\s+)/);
  segment.textContent = "";

  let wordIndex = 0;
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      segment.appendChild(document.createTextNode(part));
    } else if (part) {
      const span = document.createElement("span");
      span.className = WORD_CLASS;
      span.textContent = part;
      span.setAttribute("data-index", String(wordIndex++));
      span.setAttribute("data-sentence", text.trim());
      segment.appendChild(span);
    }
  }

  segment.setAttribute(PROCESSED_ATTR, "1");
}

export function processContainer(container: HTMLElement): void {
  const segments = container.querySelectorAll<HTMLElement>(".ytp-caption-segment");
  segments.forEach(wrapWordsInSegment);
}

export function observeSubtitles(
  container: HTMLElement,
): () => void {
  processContainer(container);

  const observer = new MutationObserver(() => {
    processContainer(container);
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    observer.disconnect();
  };
}
