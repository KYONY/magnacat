import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSelectedText, getSelectionPosition, onTextSelected, cleanup } from "./selection";

describe("selection", () => {
  afterEach(() => {
    cleanup();
  });

  describe("getSelectedText", () => {
    it("returns trimmed selected text", () => {
      const mockSelection = { toString: () => "  hello world  ", rangeCount: 1 };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedText()).toBe("hello world");
    });

    it("returns empty string when no selection", () => {
      vi.spyOn(window, "getSelection").mockReturnValue(null);
      expect(getSelectedText()).toBe("");
    });
  });

  describe("getSelectionPosition", () => {
    it("returns position from selection range bounding rect", () => {
      const mockRect = { left: 50, bottom: 100, right: 150, top: 80, width: 100, height: 20 };
      const mockRange = {
        getBoundingClientRect: () => mockRect,
      };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

      const pos = getSelectionPosition();
      expect(pos).toEqual({ x: mockRect.left, y: mockRect.bottom + 5 });
    });

    it("returns null when no selection range", () => {
      vi.spyOn(window, "getSelection").mockReturnValue({ rangeCount: 0 } as unknown as Selection);
      expect(getSelectionPosition()).toBeNull();
    });
  });

  describe("onTextSelected", () => {
    it("calls callback with text on mouseup when text is selected", () => {
      const callback = vi.fn();
      onTextSelected(callback);

      const mockSelection = { toString: () => "selected text", rangeCount: 1 };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

      document.dispatchEvent(new MouseEvent("mouseup"));

      expect(callback).toHaveBeenCalledWith("selected text");
    });

    it("does NOT trigger on empty selection", () => {
      const callback = vi.fn();
      onTextSelected(callback);

      const mockSelection = { toString: () => "", rangeCount: 0 };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

      document.dispatchEvent(new MouseEvent("mouseup"));

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT trigger on whitespace-only selection", () => {
      const callback = vi.fn();
      onTextSelected(callback);

      const mockSelection = { toString: () => "   ", rangeCount: 1 };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

      document.dispatchEvent(new MouseEvent("mouseup"));

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
