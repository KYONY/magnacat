import { describe, it, expect, vi, afterEach } from "vitest";
import { createTooltip, removeTooltip, updateTooltipContent, showLoading, createTriggerIcon, removeTriggerIcon } from "./tooltip";

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
      createTooltip({ x: 100, y: 200 }, "\u043F\u0440\u0438\u0432\u0456\u0442");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const text = shadow.querySelector("[data-testid='translation-text']");
      expect(text?.textContent).toBe("\u043F\u0440\u0438\u0432\u0456\u0442");
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

  describe("callbacks", () => {
    it("calls onTts callback when TTS button is clicked", () => {
      const onTts = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello", { onTts });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const ttsBtn = shadow.querySelector("[data-testid='tts-btn']") as HTMLButtonElement;
      ttsBtn.click();
      expect(onTts).toHaveBeenCalledWith("hello");
    });

    it("calls onCopy callback when copy button is clicked", () => {
      const onCopy = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello", { onCopy });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const copyBtn = shadow.querySelector("[data-testid='copy-btn']") as HTMLButtonElement;
      copyBtn.click();
      expect(onCopy).toHaveBeenCalledWith("hello");
    });

    it("renders replace button when onReplace callback is provided", () => {
      const onReplace = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello", { onReplace });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='replace-btn']")).not.toBeNull();
    });

    it("does not render replace button when onReplace callback is not provided", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='replace-btn']")).toBeNull();
    });

    it("calls onReplace callback when replace button is clicked", () => {
      const onReplace = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello", { onReplace });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const replaceBtn = shadow.querySelector("[data-testid='replace-btn']") as HTMLButtonElement;
      replaceBtn.click();
      expect(onReplace).toHaveBeenCalledWith("hello");
    });
  });

  describe("close button", () => {
    it("removes tooltip when close button is clicked", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const closeBtn = shadow.querySelector("[data-testid='close-btn']") as HTMLButtonElement;
      closeBtn.click();
      expect(document.querySelector("#magnacat-tooltip")).toBeNull();
    });
  });

  describe("createTriggerIcon", () => {
    afterEach(() => {
      removeTriggerIcon();
    });

    it("inserts a trigger element into the DOM", () => {
      createTriggerIcon({ x: 100, y: 200 }, vi.fn());
      const host = document.querySelector("#magnacat-trigger");
      expect(host).not.toBeNull();
    });

    it("calls onClick callback when trigger button is clicked", () => {
      const onClick = vi.fn();
      createTriggerIcon({ x: 100, y: 200 }, onClick);
      const host = document.querySelector("#magnacat-trigger") as HTMLElement;
      const shadow = host.shadowRoot!;
      const btn = shadow.querySelector("[data-testid='trigger-btn']") as HTMLButtonElement;
      btn.click();
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("removes trigger from DOM after click", () => {
      createTriggerIcon({ x: 100, y: 200 }, vi.fn());
      const host = document.querySelector("#magnacat-trigger") as HTMLElement;
      const shadow = host.shadowRoot!;
      const btn = shadow.querySelector("[data-testid='trigger-btn']") as HTMLButtonElement;
      btn.click();
      expect(document.querySelector("#magnacat-trigger")).toBeNull();
    });

    it("positions trigger at given coordinates", () => {
      createTriggerIcon({ x: 50, y: 75 }, vi.fn());
      const host = document.querySelector("#magnacat-trigger") as HTMLElement;
      expect(host.style.left).toBe("50px");
      expect(host.style.top).toBe("75px");
    });

    it("replaces previous trigger on multiple calls (no duplicates)", () => {
      createTriggerIcon({ x: 10, y: 10 }, vi.fn());
      createTriggerIcon({ x: 20, y: 20 }, vi.fn());
      const triggers = document.querySelectorAll("#magnacat-trigger");
      expect(triggers.length).toBe(1);
    });
  });

  describe("removeTriggerIcon", () => {
    it("removes trigger from DOM", () => {
      createTriggerIcon({ x: 100, y: 200 }, vi.fn());
      removeTriggerIcon();
      expect(document.querySelector("#magnacat-trigger")).toBeNull();
    });

    it("does nothing if no trigger exists", () => {
      expect(() => removeTriggerIcon()).not.toThrow();
    });
  });
});
