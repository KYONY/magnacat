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

export function getSelectionPosition(): SelectionPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
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
