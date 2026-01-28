export const DEFAULT_SHORTCUT = "Ctrl+Shift+X";

export interface ParsedShortcut {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

export function parseShortcut(str: string): ParsedShortcut {
  const parts = str.split("+");
  const modifiers = parts.slice(0, -1).map((m) => m.toLowerCase());
  const key = parts[parts.length - 1];

  return {
    ctrlKey: modifiers.includes("ctrl"),
    altKey: modifiers.includes("alt"),
    shiftKey: modifiers.includes("shift"),
    metaKey: modifiers.includes("meta"),
    key: key.toLowerCase(),
  };
}

export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  return (
    event.ctrlKey === parsed.ctrlKey &&
    event.altKey === parsed.altKey &&
    event.shiftKey === parsed.shiftKey &&
    event.metaKey === parsed.metaKey &&
    event.key.toLowerCase() === parsed.key
  );
}

export function shortcutFromEvent(event: KeyboardEvent): string | null {
  const key = event.key;

  // Reject bare modifier-only presses
  if (["Control", "Alt", "Shift", "Meta"].includes(key)) return null;

  const hasModifier = event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  // Reject bare key presses (no modifier held)
  if (!hasModifier) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(key.length === 1 ? key.toUpperCase() : key);

  return parts.join("+");
}
