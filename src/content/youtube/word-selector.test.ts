import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initWordSelector, getSelectedWords, cleanupWordSelector } from "./word-selector";

function createSubtitleContainer(lines: string[]): HTMLElement {
  const container = document.createElement("div");
  container.id = "ytp-caption-window-container";
  for (const line of lines) {
    const segment = document.createElement("span");
    segment.className = "ytp-caption-segment";
    const words = line.split(" ");
    words.forEach((word, i) => {
      if (i > 0) segment.appendChild(document.createTextNode(" "));
      const span = document.createElement("span");
      span.className = "mc-word";
      span.textContent = word;
      span.setAttribute("data-index", String(i));
      span.setAttribute("data-sentence", line);
      segment.appendChild(span);
    });
    container.appendChild(segment);
  }
  return container;
}

function getWords(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".mc-word"));
}

function clickWord(word: HTMLElement, opts: Partial<MouseEventInit> = {}): void {
  word.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, ...opts }));
}

describe("word-selector", () => {
  let container: HTMLElement;
  let onWordSelected: ReturnType<typeof vi.fn>;
  let onSelectionCleared: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = createSubtitleContainer(["hello beautiful world"]);
    document.body.appendChild(container);
    onWordSelected = vi.fn();
    onSelectionCleared = vi.fn();
    initWordSelector(container, onWordSelected, onSelectionCleared);
  });

  afterEach(() => {
    cleanupWordSelector();
    document.body.innerHTML = "";
  });

  it("clicking a word adds mc-selected class", () => {
    const words = getWords(container);
    clickWord(words[0]);
    expect(words[0].classList.contains("mc-selected")).toBe(true);
  });

  it("clicking a word calls onWordSelected with text and context", () => {
    const words = getWords(container);
    clickWord(words[1]);
    expect(onWordSelected).toHaveBeenCalledWith({
      text: "beautiful",
      context: "hello beautiful world",
    });
  });

  it("clicking another word clears previous selection", () => {
    const words = getWords(container);
    clickWord(words[0]);
    clickWord(words[2]);
    expect(words[0].classList.contains("mc-selected")).toBe(false);
    expect(words[2].classList.contains("mc-selected")).toBe(true);
  });

  it("shift+click selects a range of words", () => {
    const words = getWords(container);
    clickWord(words[0]);
    clickWord(words[2], { shiftKey: true });

    expect(words[0].classList.contains("mc-selected")).toBe(true);
    expect(words[1].classList.contains("mc-selected")).toBe(true);
    expect(words[2].classList.contains("mc-selected")).toBe(true);
  });

  it("shift+click returns correct joined text", () => {
    const words = getWords(container);
    clickWord(words[0]);
    clickWord(words[2], { shiftKey: true });

    expect(onWordSelected).toHaveBeenLastCalledWith({
      text: "hello beautiful world",
      context: "hello beautiful world",
    });
  });

  it("clicking outside clears selection", () => {
    const words = getWords(container);
    clickWord(words[0]);
    expect(words[0].classList.contains("mc-selected")).toBe(true);

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(words[0].classList.contains("mc-selected")).toBe(false);
  });

  it("clicking outside calls onSelectionCleared", () => {
    const words = getWords(container);
    clickWord(words[0]);
    onSelectionCleared.mockClear();

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onSelectionCleared).toHaveBeenCalledOnce();
  });

  it("getSelectedWords returns current selection", () => {
    const words = getWords(container);
    clickWord(words[1]);

    const result = getSelectedWords();
    expect(result).toEqual({
      text: "beautiful",
      context: "hello beautiful world",
    });
  });

  it("getSelectedWords returns null when nothing selected", () => {
    expect(getSelectedWords()).toBeNull();
  });

  it("hover adds mc-hover class", () => {
    const words = getWords(container);
    words[0].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(words[0].classList.contains("mc-hover")).toBe(true);
  });

  it("mouseout removes mc-hover class", () => {
    const words = getWords(container);
    words[0].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    words[0].dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(words[0].classList.contains("mc-hover")).toBe(false);
  });

  it("cleanup removes event listeners", () => {
    cleanupWordSelector();

    const words = getWords(container);
    clickWord(words[0]);
    expect(words[0].classList.contains("mc-selected")).toBe(false);
    expect(onWordSelected).not.toHaveBeenCalled();
  });

  it("onSelectionCleared not called when nothing was selected", () => {
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onSelectionCleared).not.toHaveBeenCalled();
  });
});
