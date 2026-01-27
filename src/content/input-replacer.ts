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
    element.value = newValue;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (element.isContentEditable || element.getAttribute("contenteditable") === "true") {
    element.textContent = newValue;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function cleanupMonitors(): void {
  for (const { element, handler } of monitors) {
    element.removeEventListener("keydown", handler);
  }
  monitors.length = 0;
}
