type InputCallback = (element: HTMLElement, text: string) => void;

interface MonitorEntry {
  element: HTMLElement;
  handler: (e: Event) => void;
}

const monitors: MonitorEntry[] = [];

function getInputValue(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  return el.textContent ?? "";
}

export function monitorInput(element: HTMLElement, callback?: InputCallback): void {
  const handler = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.ctrlKey && ke.shiftKey && ke.key === "T") {
      ke.preventDefault();
      const text = getInputValue(element).trim();
      if (text && callback) {
        callback(element, text);
      }
    }
  };

  element.addEventListener("keydown", handler);
  monitors.push({ element, handler });
}

export function replaceInputValue(element: HTMLElement, newValue: string): void {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? element.value.length;
    
    // If there's a selection, replace only the selected portion
    if (start !== end) {
      const before = element.value.substring(0, start);
      const after = element.value.substring(end);
      element.value = before + newValue + after;
      // Position cursor at end of inserted text
      const newCursorPos = start + newValue.length;
      element.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      // No selection - replace entire value (fallback)
      element.value = newValue;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (element.isContentEditable || element.getAttribute("contenteditable") === "true") {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Replace only selected text in contenteditable
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newValue));
      // Collapse cursor to end of inserted text
      selection.collapseToEnd();
    } else {
      // No selection - replace entire content (fallback)
      element.textContent = newValue;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function cleanupMonitors(): void {
  for (const { element, handler } of monitors) {
    element.removeEventListener("keydown", handler);
  }
  monitors.length = 0;
}
