export interface SelectionPosition {
  x: number;
  y: number;
}

type SelectionCallback = (text: string) => void;

let mouseupHandler: ((e: MouseEvent) => void) | null = null;

export function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection) return "";
  return selection.toString().trim();
}

const BLOCK_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li"]);
const INLINE_FORMAT_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "sub", "sup"]);

function cleanHtmlNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  let childContent = "";
  el.childNodes.forEach((child) => {
    childContent += cleanHtmlNode(child);
  });

  if (tag === "br") return "<br>";

  if (BLOCK_TAGS.has(tag) || INLINE_FORMAT_TAGS.has(tag)) {
    return `<${tag}>${childContent}</${tag}>`;
  }

  // Check inline styles for formatting on unknown tags (e.g. styled spans)
  const style = el.style;
  let prefix = "";
  let suffix = "";

  if (style.fontWeight === "bold" || style.fontWeight === "700" || Number(style.fontWeight) >= 700) {
    prefix += "<b>";
    suffix = "</b>" + suffix;
  }
  if (style.fontStyle === "italic") {
    prefix += "<i>";
    suffix = "</i>" + suffix;
  }
  if (style.textDecoration?.includes("underline") || style.textDecorationLine?.includes("underline")) {
    prefix += "<u>";
    suffix = "</u>" + suffix;
  }

  return prefix + childContent + suffix;
}

export function getSelectedHtml(): string {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return "";

    const container = document.createElement("div");
    for (let i = 0; i < selection.rangeCount; i++) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }

    let html = "";
    container.childNodes.forEach((child) => {
      html += cleanHtmlNode(child);
    });
    return html.trim();
  } catch {
    return "";
  }
}

export function getSelectionPosition(): SelectionPosition | null {
  const activeEl = document.activeElement;

  // For input/textarea, use element position since range.getBoundingClientRect() returns (0,0)
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    const rect = activeEl.getBoundingClientRect();
    return { x: rect.left + 10, y: rect.bottom + 5 };
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Fallback if rect is at origin (can happen in some edge cases)
  if (rect.left === 0 && rect.top === 0 && rect.width === 0) {
    return null;
  }
  
  return { x: rect.left, y: rect.bottom + 5 };
}

export function getSelectionSourceElement(): HTMLElement | null {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true"))
  ) {
    return el as HTMLElement;
  }
  return null;
}

export function onTextSelected(callback: SelectionCallback): void {
  cleanup();
  mouseupHandler = () => {
    const text = getSelectedText();
    if (text) callback(text);
  };
  document.addEventListener("mouseup", mouseupHandler);
}

export function cleanup(): void {
  if (mouseupHandler) {
    document.removeEventListener("mouseup", mouseupHandler);
    mouseupHandler = null;
  }
}
