import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTooltip, removeTooltip, updateTooltipContent, showLoading } from "./tooltip";

describe("tooltip", () => {
  afterEach(() => {
    removeTooltip();
  });

  describe("createTooltip", () => {
    it("inserts a tooltip element into the DOM", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip");
      expect(host).not.toBeNull();
    });

    it("contains translation text", () => {
      createTooltip({ x: 100, y: 200 }, "привіт");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const text = shadow.querySelector("[data-testid='translation-text']");
      expect(text?.textContent).toBe("привіт");
    });

    it("contains TTS button", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='tts-btn']")).not.toBeNull();
    });

    it("contains copy button", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='copy-btn']")).not.toBeNull();
    });

    it("contains close button", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='close-btn']")).not.toBeNull();
    });

    it("replaces previous tooltip on multiple calls (no duplicates)", () => {
      createTooltip({ x: 10, y: 10 }, "first");
      createTooltip({ x: 20, y: 20 }, "second");
      const tooltips = document.querySelectorAll("#magnacat-tooltip");
      expect(tooltips.length).toBe(1);
      const shadow = (tooltips[0] as HTMLElement).shadowRoot!;
      const text = shadow.querySelector("[data-testid='translation-text']");
      expect(text?.textContent).toBe("second");
    });
  });

  describe("removeTooltip", () => {
    it("removes tooltip from DOM", () => {
      createTooltip({ x: 100, y: 200 }, "text");
      removeTooltip();
      expect(document.querySelector("#magnacat-tooltip")).toBeNull();
    });

    it("does nothing if no tooltip exists", () => {
      expect(() => removeTooltip()).not.toThrow();
    });
  });

  describe("updateTooltipContent", () => {
    it("updates translation text", () => {
      createTooltip({ x: 100, y: 200 }, "old");
      updateTooltipContent("new");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const text = shadow.querySelector("[data-testid='translation-text']");
      expect(text?.textContent).toBe("new");
    });
  });

  describe("showLoading", () => {
    it("shows loading state", () => {
      createTooltip({ x: 100, y: 200 }, "");
      showLoading();
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const spinner = shadow.querySelector("[data-testid='loading']");
      expect(spinner).not.toBeNull();
    });
  });
});
