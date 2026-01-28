import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSelectedText, getSelectionPosition, getSelectionSourceElement, onTextSelected, cleanup } from "./selection";

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

    it("returns position based on input element rect when input is focused", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      // Mock getBoundingClientRect
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
        left: 100,
        bottom: 50,
        right: 200,
        top: 30,
        width: 100,
        height: 20,
        x: 100,
        y: 30,
        toJSON: () => ({}),
      });

      const pos = getSelectionPosition();
      expect(pos).toEqual({ x: 110, y: 55 }); // left + 10, bottom + 5
      document.body.removeChild(input);
    });

    it("returns position based on textarea element rect when textarea is focused", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      vi.spyOn(textarea, "getBoundingClientRect").mockReturnValue({
        left: 50,
        bottom: 120,
        right: 250,
        top: 80,
        width: 200,
        height: 40,
        x: 50,
        y: 80,
        toJSON: () => ({}),
      });

      const pos = getSelectionPosition();
      expect(pos).toEqual({ x: 60, y: 125 }); // left + 10, bottom + 5
      document.body.removeChild(textarea);
    });

    it("returns null when range rect is at origin with zero width", () => {
      const mockRect = { left: 0, bottom: 0, right: 0, top: 0, width: 0, height: 0 };
      const mockRange = { getBoundingClientRect: () => mockRect };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectionPosition()).toBeNull();
    });
  });

  describe("getSelectionSourceElement", () => {
    it("returns input element when it is the active element", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();
      const result = getSelectionSourceElement();
      expect(result).toBe(input);
      document.body.removeChild(input);
    });

    it("returns textarea element when it is the active element", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();
      const result = getSelectionSourceElement();
      expect(result).toBe(textarea);
      document.body.removeChild(textarea);
    });

    it("returns null when active element is document.body", () => {
      document.body.focus();
      const result = getSelectionSourceElement();
      expect(result).toBeNull();
    });

    it("returns contenteditable element when it is the active element", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      div.tabIndex = 0; // Make focusable in jsdom
      document.body.appendChild(div);
      div.focus();
      const result = getSelectionSourceElement();
      expect(result).toBe(div);
      document.body.removeChild(div);
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
