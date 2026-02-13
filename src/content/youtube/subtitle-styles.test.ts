import { describe, it, expect, afterEach } from "vitest";
import { injectSubtitleStyles, removeSubtitleStyles } from "./subtitle-styles";

describe("subtitle-styles", () => {
  afterEach(() => {
    removeSubtitleStyles();
  });

  it("injects a style element into document head", () => {
    injectSubtitleStyles();
    const style = document.getElementById("magnacat-subtitle-styles");
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe("STYLE");
  });

  it("style contains mc-word rules", () => {
    injectSubtitleStyles();
    const style = document.getElementById("magnacat-subtitle-styles");
    expect(style?.textContent).toContain(".mc-word");
    expect(style?.textContent).toContain(".mc-selected");
    expect(style?.textContent).toContain(".mc-hover");
    expect(style?.textContent).toContain("cursor: pointer");
    expect(style?.textContent).toContain("user-select: none");
  });

  it("does not inject duplicate styles", () => {
    injectSubtitleStyles();
    injectSubtitleStyles();
    const styles = document.querySelectorAll("#magnacat-subtitle-styles");
    expect(styles.length).toBe(1);
  });

  it("removeSubtitleStyles removes the style element", () => {
    injectSubtitleStyles();
    removeSubtitleStyles();
    const style = document.getElementById("magnacat-subtitle-styles");
    expect(style).toBeNull();
  });

  it("removeSubtitleStyles is safe to call when no styles exist", () => {
    expect(() => removeSubtitleStyles()).not.toThrow();
  });
});
