import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSelectedText, getSelectedHtml, getSelectionPosition, getSelectionSourceElement, onTextSelected, cleanup } from "./selection";

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

  describe("getSelectedHtml", () => {
    it("returns empty string when no selection", () => {
      vi.spyOn(window, "getSelection").mockReturnValue(null);
      expect(getSelectedHtml()).toBe("");
    });

    it("returns empty string when rangeCount is 0", () => {
      vi.spyOn(window, "getSelection").mockReturnValue({ rangeCount: 0 } as unknown as Selection);
      expect(getSelectedHtml()).toBe("");
    });

    it("preserves paragraph tags from selection", () => {
      const fragment = document.createDocumentFragment();
      const p1 = document.createElement("p");
      p1.textContent = "First paragraph";
      const p2 = document.createElement("p");
      p2.textContent = "Second paragraph";
      fragment.appendChild(p1);
      fragment.appendChild(p2);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<p>First paragraph</p><p>Second paragraph</p>");
    });

    it("preserves bold and italic formatting", () => {
      const fragment = document.createDocumentFragment();
      const b = document.createElement("b");
      b.textContent = "bold";
      const i = document.createElement("i");
      i.textContent = "italic";
      fragment.appendChild(b);
      fragment.appendChild(document.createTextNode(" and "));
      fragment.appendChild(i);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<b>bold</b> and <i>italic</i>");
    });

    it("preserves br tags", () => {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode("line 1"));
      fragment.appendChild(document.createElement("br"));
      fragment.appendChild(document.createTextNode("line 2"));

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("line 1<br>line 2");
    });

    it("strips unknown tags but keeps their content", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.textContent = "text in span";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("text in span");
    });

    it("detects bold from inline style on span", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.style.fontWeight = "bold";
      span.textContent = "styled bold";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<b>styled bold</b>");
    });

    it("detects bold from numeric fontWeight 700", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.style.fontWeight = "700";
      span.textContent = "numeric bold";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<b>numeric bold</b>");
    });

    it("detects italic from inline style on span", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.style.fontStyle = "italic";
      span.textContent = "styled italic";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<i>styled italic</i>");
    });

    it("detects underline from textDecoration style", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.style.textDecoration = "underline";
      span.textContent = "underlined";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<u>underlined</u>");
    });

    it("detects combined bold + italic styles on same element", () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.style.fontWeight = "bold";
      span.style.fontStyle = "italic";
      span.textContent = "bold italic";
      fragment.appendChild(span);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<b><i>bold italic</i></b>");
    });

    it("preserves strong, em, u semantic tags", () => {
      const fragment = document.createDocumentFragment();
      const strong = document.createElement("strong");
      strong.textContent = "strong";
      const em = document.createElement("em");
      em.textContent = "emphasis";
      const u = document.createElement("u");
      u.textContent = "underline";
      fragment.appendChild(strong);
      fragment.appendChild(em);
      fragment.appendChild(u);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<strong>strong</strong><em>emphasis</em><u>underline</u>");
    });

    it("preserves heading tags", () => {
      const fragment = document.createDocumentFragment();
      const h1 = document.createElement("h1");
      h1.textContent = "Title";
      const h3 = document.createElement("h3");
      h3.textContent = "Subtitle";
      fragment.appendChild(h1);
      fragment.appendChild(h3);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<h1>Title</h1><h3>Subtitle</h3>");
    });

    it("preserves list tags", () => {
      const fragment = document.createDocumentFragment();
      const ul = document.createElement("ul");
      const li1 = document.createElement("li");
      li1.textContent = "Item 1";
      const li2 = document.createElement("li");
      li2.textContent = "Item 2";
      ul.appendChild(li1);
      ul.appendChild(li2);
      fragment.appendChild(ul);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<ul><li>Item 1</li><li>Item 2</li></ul>");
    });

    it("preserves nested formatting inside paragraphs", () => {
      const fragment = document.createDocumentFragment();
      const p = document.createElement("p");
      const b = document.createElement("b");
      b.textContent = "bold";
      p.appendChild(b);
      p.appendChild(document.createTextNode(" and normal"));
      fragment.appendChild(p);

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = { rangeCount: 1, getRangeAt: () => mockRange };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("<p><b>bold</b> and normal</p>");
    });

    it("handles multiple selection ranges", () => {
      const fragment1 = document.createDocumentFragment();
      fragment1.appendChild(document.createTextNode("first"));
      const fragment2 = document.createDocumentFragment();
      fragment2.appendChild(document.createTextNode(" second"));

      const mockSelection = {
        rangeCount: 2,
        getRangeAt: (i: number) => ({
          cloneContents: () => i === 0 ? fragment1 : fragment2,
        }),
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("first second");
    });

    it("returns empty string when cloneContents throws", () => {
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => ({
          cloneContents: () => { throw new Error("SecurityError"); },
        }),
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("");
    });

    it("preserves emojis in text", () => {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode("Hello \u{1F600} World \u{1F389}"));

      const mockRange = { cloneContents: () => fragment };
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: () => mockRange,
      };
      vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);
      expect(getSelectedHtml()).toBe("Hello \u{1F600} World \u{1F389}");
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
