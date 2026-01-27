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
