import { describe, it, expect, vi, afterEach } from "vitest";
import { createTooltip, removeTooltip, updateTooltipContent, showLoading, createTriggerIcon, removeTriggerIcon, setOnCloseCallback, sanitizeHtml } from "./tooltip";

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
      const onTts = vi.fn().mockResolvedValue(undefined);
      createTooltip({ x: 100, y: 200 }, "hello", { onTts });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const ttsBtn = shadow.querySelector("[data-testid='tts-btn']") as HTMLButtonElement;
      ttsBtn.click();
      expect(onTts).toHaveBeenCalledWith("hello");
    });

    it("shows loading spinner on TTS button while waiting", async () => {
      let resolveOnTts!: () => void;
      const onTts = vi.fn().mockImplementation(() => new Promise<void>((r) => { resolveOnTts = r; }));
      createTooltip({ x: 100, y: 200 }, "hello", { onTts });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const ttsBtn = shadow.querySelector("[data-testid='tts-btn']") as HTMLButtonElement;

      ttsBtn.click();
      expect(ttsBtn.classList.contains("loading")).toBe(true);
      expect(ttsBtn.querySelector(".btn-spinner")).not.toBeNull();

      resolveOnTts();
      await new Promise((r) => setTimeout(r, 0));

      expect(ttsBtn.classList.contains("loading")).toBe(false);
      expect(ttsBtn.textContent).toBe("\u{1F50A}");
    });

    it("ignores TTS button click while already loading", () => {
      let resolveOnTts!: () => void;
      const onTts = vi.fn().mockImplementation(() => new Promise<void>((r) => { resolveOnTts = r; }));
      createTooltip({ x: 100, y: 200 }, "hello", { onTts });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const ttsBtn = shadow.querySelector("[data-testid='tts-btn']") as HTMLButtonElement;

      ttsBtn.click();
      ttsBtn.click();
      expect(onTts).toHaveBeenCalledTimes(1);
      resolveOnTts();
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

    it("renders spell check button when onSpellCheck callback is provided", () => {
      const onSpellCheck = vi.fn().mockResolvedValue("corrected");
      createTooltip({ x: 100, y: 200 }, "hello", { onSpellCheck });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='spellcheck-btn']")).not.toBeNull();
    });

    it("does not render spell check button when onSpellCheck callback is not provided", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='spellcheck-btn']")).toBeNull();
    });

    it("calls onSpellCheck and updates text content with corrected text", async () => {
      const onSpellCheck = vi.fn().mockResolvedValue("corrected text");
      createTooltip({ x: 100, y: 200 }, "misspeled text", { onSpellCheck });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const spellCheckBtn = shadow.querySelector("[data-testid='spellcheck-btn']") as HTMLButtonElement;
      const textEl = shadow.querySelector("[data-testid='translation-text']") as HTMLElement;

      spellCheckBtn.click();
      await new Promise((r) => setTimeout(r, 0));

      expect(onSpellCheck).toHaveBeenCalledWith("misspeled text");
      expect(textEl.textContent).toBe("corrected text");
    });

    it("shows loading spinner on spell check button while waiting", async () => {
      let resolveSpellCheck!: (value: string) => void;
      const onSpellCheck = vi.fn().mockImplementation(() => new Promise<string>((r) => { resolveSpellCheck = r; }));
      createTooltip({ x: 100, y: 200 }, "text", { onSpellCheck });
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const spellCheckBtn = shadow.querySelector("[data-testid='spellcheck-btn']") as HTMLButtonElement;

      spellCheckBtn.click();
      expect(spellCheckBtn.classList.contains("loading")).toBe(true);
      expect(spellCheckBtn.querySelector(".btn-spinner")).not.toBeNull();

      resolveSpellCheck("corrected");
      await new Promise((r) => setTimeout(r, 0));

      expect(spellCheckBtn.classList.contains("loading")).toBe(false);
      expect(spellCheckBtn.textContent).toBe("\u2713");
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

  describe("onClose callback", () => {
    it("calls onClose callback when tooltip is removed", () => {
      const onClose = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello");
      setOnCloseCallback(onClose);
      removeTooltip();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("calls onClose callback when close button is clicked", () => {
      const onClose = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello");
      setOnCloseCallback(onClose);
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const closeBtn = shadow.querySelector("[data-testid='close-btn']") as HTMLButtonElement;
      closeBtn.click();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("resets onClose callback after removal", () => {
      const onClose = vi.fn();
      createTooltip({ x: 100, y: 200 }, "hello");
      setOnCloseCallback(onClose);
      removeTooltip();
      // Second remove should not call it again
      removeTooltip();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("removes tooltip even if onClose callback throws", () => {
      const onClose = vi.fn(() => { throw new Error("callback error"); });
      createTooltip({ x: 100, y: 200 }, "hello");
      setOnCloseCallback(onClose);
      expect(() => removeTooltip()).not.toThrow();
      expect(document.querySelector("#magnacat-tooltip")).toBeNull();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("draggable tooltip", () => {
    it("updates position after mousedown + mousemove", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const container = shadow.querySelector(".tooltip") as HTMLElement;

      // Mock getBoundingClientRect on host
      host.getBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 200,
        right: 300,
        bottom: 400,
        width: 200,
        height: 200,
        x: 100,
        y: 200,
        toJSON: () => ({}),
      }));

      // Mousedown on container (not button/text)
      container.dispatchEvent(new MouseEvent("mousedown", { clientX: 150, clientY: 250, bubbles: true }));

      // Mousemove on document
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 300 }));

      // offset = clientX(150) - left(100) = 50, new left = 200 - 50 = 150
      expect(host.style.left).toBe("150px");
      // offset = clientY(250) - top(200) = 50, new top = 300 - 50 = 250
      expect(host.style.top).toBe("250px");
    });

    it("does not drag when clicking a button", () => {
      createTooltip({ x: 100, y: 200 }, "hello");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const ttsBtn = shadow.querySelector("[data-testid='tts-btn']") as HTMLButtonElement;

      host.getBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 200,
        right: 300,
        bottom: 400,
        width: 200,
        height: 200,
        x: 100,
        y: 200,
        toJSON: () => ({}),
      }));

      ttsBtn.dispatchEvent(new MouseEvent("mousedown", { clientX: 150, clientY: 250, bubbles: true }));
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 300 }));

      // Position should remain unchanged
      expect(host.style.left).toBe("100px");
      expect(host.style.top).toBe("200px");
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

  describe("sanitizeHtml", () => {
    it("preserves safe tags", () => {
      expect(sanitizeHtml("<p>Hello</p>")).toBe("<p>Hello</p>");
      expect(sanitizeHtml("<b>bold</b>")).toBe("<b>bold</b>");
      expect(sanitizeHtml("<i>italic</i>")).toBe("<i>italic</i>");
      expect(sanitizeHtml("<u>underline</u>")).toBe("<u>underline</u>");
      expect(sanitizeHtml("<br>")).toBe("<br>");
    });

    it("strips script tags completely", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("");
    });

    it("strips unknown tags but keeps content", () => {
      expect(sanitizeHtml('<span class="foo">text</span>')).toBe("<span>text</span>");
    });

    it("strips all attributes from tags", () => {
      expect(sanitizeHtml('<p style="color:red" class="foo">text</p>')).toBe("<p>text</p>");
    });

    it("escapes text content to prevent injection", () => {
      expect(sanitizeHtml("1 < 2 & 3 > 0")).toBe("1 &lt; 2 &amp; 3 &gt; 0");
    });

    it("preserves nested formatting", () => {
      expect(sanitizeHtml("<p><b>bold <i>and italic</i></b></p>")).toBe("<p><b>bold <i>and italic</i></b></p>");
    });

    it("preserves heading tags", () => {
      expect(sanitizeHtml("<h1>Title</h1>")).toBe("<h1>Title</h1>");
      expect(sanitizeHtml("<h2>Subtitle</h2>")).toBe("<h2>Subtitle</h2>");
      expect(sanitizeHtml("<h6>Small</h6>")).toBe("<h6>Small</h6>");
    });

    it("preserves list tags", () => {
      expect(sanitizeHtml("<ul><li>one</li><li>two</li></ul>")).toBe("<ul><li>one</li><li>two</li></ul>");
      expect(sanitizeHtml("<ol><li>first</li></ol>")).toBe("<ol><li>first</li></ol>");
    });

    it("preserves blockquote tag", () => {
      expect(sanitizeHtml("<blockquote>quoted text</blockquote>")).toBe("<blockquote>quoted text</blockquote>");
    });

    it("strips img tag with onerror XSS", () => {
      const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("<img");
    });

    it("strips event handler attributes from safe tags", () => {
      expect(sanitizeHtml('<p onclick="alert(1)">text</p>')).toBe("<p>text</p>");
    });

    it("returns empty string for empty input", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("preserves s, sub, sup tags", () => {
      expect(sanitizeHtml("<s>strikethrough</s>")).toBe("<s>strikethrough</s>");
      expect(sanitizeHtml("H<sub>2</sub>O")).toBe("H<sub>2</sub>O");
      expect(sanitizeHtml("x<sup>2</sup>")).toBe("x<sup>2</sup>");
    });
  });

  describe("updateTooltipContent with HTML", () => {
    it("renders HTML content with safe tags", () => {
      createTooltip({ x: 100, y: 200 }, "");
      updateTooltipContent("<p>Paragraph 1</p><p>Paragraph 2</p>");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const textEl = shadow.querySelector("[data-testid='translation-text']") as HTMLElement;
      expect(textEl.innerHTML).toContain("<p>");
      expect(textEl.textContent).toBe("Paragraph 1Paragraph 2");
    });

    it("renders plain text content as textContent", () => {
      createTooltip({ x: 100, y: 200 }, "");
      updateTooltipContent("simple text");
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      const textEl = shadow.querySelector("[data-testid='translation-text']") as HTMLElement;
      expect(textEl.textContent).toBe("simple text");
      expect(textEl.innerHTML).toBe("simple text");
    });

    it("removes loading indicator after content update", () => {
      createTooltip({ x: 100, y: 200 }, "");
      showLoading();
      const host = document.querySelector("#magnacat-tooltip") as HTMLElement;
      const shadow = host.shadowRoot!;
      expect(shadow.querySelector("[data-testid='loading']")).not.toBeNull();

      updateTooltipContent("translated");
      expect(shadow.querySelector("[data-testid='loading']")).toBeNull();
    });

    it("does nothing when no tooltip exists", () => {
      removeTooltip();
      expect(() => updateTooltipContent("text")).not.toThrow();
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
