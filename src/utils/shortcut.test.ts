import { describe, it, expect } from "vitest";
import { DEFAULT_SHORTCUT, parseShortcut, matchesShortcut, shortcutFromEvent } from "./shortcut";

function makeKeyEvent(init: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
  return new KeyboardEvent("keydown", init);
}

describe("shortcut utils", () => {
  it("DEFAULT_SHORTCUT is Ctrl+Shift+X", () => {
    expect(DEFAULT_SHORTCUT).toBe("Ctrl+Shift+X");
  });

  describe("parseShortcut", () => {
    it("parses Ctrl+Shift+X", () => {
      const result = parseShortcut("Ctrl+Shift+X");
      expect(result).toEqual({ ctrlKey: true, altKey: false, shiftKey: true, metaKey: false, key: "x" });
    });

    it("parses Alt+T", () => {
      const result = parseShortcut("Alt+T");
      expect(result).toEqual({ ctrlKey: false, altKey: true, shiftKey: false, metaKey: false, key: "t" });
    });

    it("parses Meta+Shift+Enter", () => {
      const result = parseShortcut("Meta+Shift+Enter");
      expect(result).toEqual({ ctrlKey: false, altKey: false, shiftKey: true, metaKey: true, key: "enter" });
    });
  });

  describe("matchesShortcut", () => {
    it("returns true for matching event", () => {
      const parsed = parseShortcut("Ctrl+Shift+X");
      const event = makeKeyEvent({ key: "x", ctrlKey: true, shiftKey: true });
      expect(matchesShortcut(event, parsed)).toBe(true);
    });

    it("returns false when modifier differs", () => {
      const parsed = parseShortcut("Ctrl+Shift+X");
      const event = makeKeyEvent({ key: "x", ctrlKey: true, shiftKey: false });
      expect(matchesShortcut(event, parsed)).toBe(false);
    });

    it("returns false when key differs", () => {
      const parsed = parseShortcut("Ctrl+Shift+X");
      const event = makeKeyEvent({ key: "z", ctrlKey: true, shiftKey: true });
      expect(matchesShortcut(event, parsed)).toBe(false);
    });

    it("returns false when extra modifier is present", () => {
      const parsed = parseShortcut("Ctrl+X");
      const event = makeKeyEvent({ key: "x", ctrlKey: true, altKey: true });
      expect(matchesShortcut(event, parsed)).toBe(false);
    });
  });

  describe("shortcutFromEvent", () => {
    it("builds canonical string from event", () => {
      const event = makeKeyEvent({ key: "t", altKey: true });
      expect(shortcutFromEvent(event)).toBe("Alt+T");
    });

    it("returns null for bare key press", () => {
      const event = makeKeyEvent({ key: "a" });
      expect(shortcutFromEvent(event)).toBeNull();
    });

    it("returns null for modifier-only press", () => {
      const event = makeKeyEvent({ key: "Control", ctrlKey: true });
      expect(shortcutFromEvent(event)).toBeNull();
    });

    it("preserves multi-char key names", () => {
      const event = makeKeyEvent({ key: "Enter", ctrlKey: true });
      expect(shortcutFromEvent(event)).toBe("Ctrl+Enter");
    });

    it("orders modifiers Ctrl+Alt+Shift+Meta", () => {
      const event = makeKeyEvent({ key: "k", ctrlKey: true, altKey: true, shiftKey: true, metaKey: true });
      expect(shortcutFromEvent(event)).toBe("Ctrl+Alt+Shift+Meta+K");
    });
  });
});
