import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { wrapWordsInSegment, processContainer, observeSubtitles } from "./subtitle-processor";

function createSegment(text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "ytp-caption-segment";
  span.textContent = text;
  return span;
}

function createCaptionContainer(lines: string[]): HTMLElement {
  const container = document.createElement("div");
  container.id = "ytp-caption-window-container";
  for (const line of lines) {
    const window = document.createElement("div");
    window.className = "caption-window";
    const text = document.createElement("span");
    text.className = "captions-text";
    const visualLine = document.createElement("span");
    visualLine.className = "caption-visual-line";
    const segment = createSegment(line);
    visualLine.appendChild(segment);
    text.appendChild(visualLine);
    window.appendChild(text);
    container.appendChild(window);
  }
  return container;
}

describe("subtitle-processor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("wrapWordsInSegment", () => {
    it("wraps each word in a span with mc-word class", () => {
      const segment = createSegment("hello world");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      expect(words.length).toBe(2);
      expect(words[0].textContent).toBe("hello");
      expect(words[1].textContent).toBe("world");
    });

    it("preserves spaces between words", () => {
      const segment = createSegment("hello world");
      wrapWordsInSegment(segment);

      expect(segment.textContent).toBe("hello world");
    });

    it("sets data-index on each word span", () => {
      const segment = createSegment("one two three");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      expect(words[0].getAttribute("data-index")).toBe("0");
      expect(words[1].getAttribute("data-index")).toBe("1");
      expect(words[2].getAttribute("data-index")).toBe("2");
    });

    it("sets data-sentence with full trimmed text", () => {
      const segment = createSegment("hello beautiful world");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      for (const word of words) {
        expect(word.getAttribute("data-sentence")).toBe("hello beautiful world");
      }
    });

    it("handles empty text", () => {
      const segment = createSegment("");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      expect(words.length).toBe(0);
    });

    it("handles whitespace-only text", () => {
      const segment = createSegment("   ");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      expect(words.length).toBe(0);
    });

    it("handles single word", () => {
      const segment = createSegment("hello");
      wrapWordsInSegment(segment);

      const words = segment.querySelectorAll(".mc-word");
      expect(words.length).toBe(1);
      expect(words[0].textContent).toBe("hello");
    });

    it("does not re-process already processed segments", () => {
      const segment = createSegment("hello world");
      wrapWordsInSegment(segment);
      const firstHtml = segment.innerHTML;

      wrapWordsInSegment(segment);
      expect(segment.innerHTML).toBe(firstHtml);
    });

    it("marks segment as processed with data attribute", () => {
      const segment = createSegment("hello");
      wrapWordsInSegment(segment);

      expect(segment.getAttribute("data-mc-processed")).toBe("1");
    });
  });

  describe("processContainer", () => {
    it("wraps words in all caption segments", () => {
      const container = createCaptionContainer(["hello world", "foo bar"]);
      document.body.appendChild(container);

      processContainer(container);

      const words = container.querySelectorAll(".mc-word");
      expect(words.length).toBe(4);
    });

    it("handles empty container", () => {
      const container = document.createElement("div");
      processContainer(container);

      const words = container.querySelectorAll(".mc-word");
      expect(words.length).toBe(0);
    });
  });

  describe("observeSubtitles", () => {
    it("processes existing segments immediately", () => {
      const container = createCaptionContainer(["hello world"]);
      document.body.appendChild(container);

      const cleanup = observeSubtitles(container);

      const words = container.querySelectorAll(".mc-word");
      expect(words.length).toBe(2);

      cleanup();
    });

    it("processes new segments added via MutationObserver", async () => {
      const container = createCaptionContainer(["initial text"]);
      document.body.appendChild(container);

      const cleanup = observeSubtitles(container);

      // Add a new caption line
      const window = document.createElement("div");
      window.className = "caption-window";
      const text = document.createElement("span");
      text.className = "captions-text";
      const visualLine = document.createElement("span");
      visualLine.className = "caption-visual-line";
      const segment = document.createElement("span");
      segment.className = "ytp-caption-segment";
      segment.textContent = "new subtitle line";
      visualLine.appendChild(segment);
      text.appendChild(visualLine);
      window.appendChild(text);
      container.appendChild(window);

      await new Promise((r) => setTimeout(r, 50));

      const newWords = segment.querySelectorAll(".mc-word");
      expect(newWords.length).toBe(3);

      cleanup();
    });

    it("cleanup disconnects observer", async () => {
      const container = createCaptionContainer(["hello"]);
      document.body.appendChild(container);

      const cleanup = observeSubtitles(container);
      cleanup();

      // Add new segment after cleanup
      const segment = document.createElement("span");
      segment.className = "ytp-caption-segment";
      segment.textContent = "should not process";
      container.appendChild(segment);

      await new Promise((r) => setTimeout(r, 50));

      const words = segment.querySelectorAll(".mc-word");
      expect(words.length).toBe(0);
    });
  });
});
