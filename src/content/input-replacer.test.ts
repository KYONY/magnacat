import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { monitorInput, replaceInputValue, cleanupMonitors } from "./input-replacer";

describe("input-replacer", () => {
  afterEach(() => {
    cleanupMonitors();
  });

  describe("monitorInput", () => {
    it("attaches keydown listener to input element", () => {
      const input = document.createElement("input");
      const spy = vi.spyOn(input, "addEventListener");
      monitorInput(input);
      expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    it("attaches keydown listener to textarea element", () => {
      const textarea = document.createElement("textarea");
      const spy = vi.spyOn(textarea, "addEventListener");
      monitorInput(textarea);
      expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    it("triggers callback on Ctrl+Shift+T", () => {
      const input = document.createElement("input");
      input.value = "привіт світ";
      const callback = vi.fn();
      monitorInput(input, callback);

      const event = new KeyboardEvent("keydown", {
        key: "T",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(input, "привіт світ");
    });

    it("does NOT trigger on Ctrl+T (without Shift)", () => {
      const input = document.createElement("input");
      input.value = "text";
      const callback = vi.fn();
      monitorInput(input, callback);

      const event = new KeyboardEvent("keydown", {
        key: "T",
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT trigger on empty input", () => {
      const input = document.createElement("input");
      input.value = "";
      const callback = vi.fn();
      monitorInput(input, callback);

      const event = new KeyboardEvent("keydown", {
        key: "T",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("replaceInputValue", () => {
    it("sets value on input element", () => {
      const input = document.createElement("input");
      input.value = "old";
      replaceInputValue(input, "new");
      expect(input.value).toBe("new");
    });

    it("sets value on textarea element", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "old";
      replaceInputValue(textarea, "new");
      expect(textarea.value).toBe("new");
    });

    it("dispatches input event after replacement", () => {
      const input = document.createElement("input");
      const spy = vi.fn();
      input.addEventListener("input", spy);
      replaceInputValue(input, "new");
      expect(spy).toHaveBeenCalled();
    });

    it("sets textContent on contenteditable element", () => {
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      replaceInputValue(div, "new text");
      expect(div.textContent).toBe("new text");
    });

    it("replaces only selected portion in input element", () => {
      const input = document.createElement("input");
      input.value = "hello world test";
      // Simulate selection of "world" (positions 6-11)
      input.setSelectionRange(6, 11);
      replaceInputValue(input, "REPLACED");
      expect(input.value).toBe("hello REPLACED test");
    });

    it("replaces only selected portion in textarea element", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "one two three";
      // Simulate selection of "two" (positions 4-7)
      textarea.setSelectionRange(4, 7);
      replaceInputValue(textarea, "TWO");
      expect(textarea.value).toBe("one TWO three");
    });

    it("positions cursor at end of replaced text", () => {
      const input = document.createElement("input");
      input.value = "abc def ghi";
      input.setSelectionRange(4, 7); // select "def"
      replaceInputValue(input, "XY");
      expect(input.selectionStart).toBe(6); // 4 + 2 (length of "XY")
      expect(input.selectionEnd).toBe(6);
    });

    it("replaces entire value when no selection (cursor collapsed)", () => {
      const input = document.createElement("input");
      input.value = "old text";
      input.setSelectionRange(3, 3); // cursor at position 3, no selection
      replaceInputValue(input, "new");
      expect(input.value).toBe("new");
    });
  });

  describe("cleanupMonitors", () => {
    it("removes all attached listeners", () => {
      const input = document.createElement("input");
      const removeSpy = vi.spyOn(input, "removeEventListener");
      monitorInput(input);
      cleanupMonitors();
      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });
  });
});
