import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isYouTubePage, isVideoPage, findSubtitleContainer, onSubtitlesToggled } from "./youtube-detector";

function setLocation(hostname: string, pathname = "/") {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { hostname, pathname },
  });
}

describe("youtube-detector", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("isYouTubePage", () => {
    it("returns true for www.youtube.com", () => {
      setLocation("www.youtube.com");
      expect(isYouTubePage()).toBe(true);
    });

    it("returns true for m.youtube.com", () => {
      setLocation("m.youtube.com");
      expect(isYouTubePage()).toBe(true);
    });

    it("returns true for youtube.com", () => {
      setLocation("youtube.com");
      expect(isYouTubePage()).toBe(true);
    });

    it("returns false for google.com", () => {
      setLocation("google.com");
      expect(isYouTubePage()).toBe(false);
    });

    it("returns false for youtube.com.fake.site", () => {
      setLocation("youtube.com.fake.site");
      expect(isYouTubePage()).toBe(false);
    });
  });

  describe("isVideoPage", () => {
    it("returns true for /watch on youtube.com", () => {
      setLocation("www.youtube.com", "/watch");
      expect(isVideoPage()).toBe(true);
    });

    it("returns false for /results on youtube.com", () => {
      setLocation("www.youtube.com", "/results");
      expect(isVideoPage()).toBe(false);
    });

    it("returns false for / on youtube.com", () => {
      setLocation("www.youtube.com", "/");
      expect(isVideoPage()).toBe(false);
    });

    it("returns false for /watch on non-youtube", () => {
      setLocation("evil.com", "/watch");
      expect(isVideoPage()).toBe(false);
    });
  });

  describe("findSubtitleContainer", () => {
    it("returns element when caption container exists", () => {
      const container = document.createElement("div");
      container.id = "ytp-caption-window-container";
      document.body.appendChild(container);
      expect(findSubtitleContainer()).toBe(container);
    });

    it("returns null when caption container does not exist", () => {
      expect(findSubtitleContainer()).toBeNull();
    });
  });

  describe("onSubtitlesToggled", () => {
    it("returns null when movie_player is not in DOM", () => {
      const callback = vi.fn();
      const cleanup = onSubtitlesToggled(callback);
      expect(cleanup).toBeNull();
    });

    it("calls callback when caption container appears", async () => {
      const player = document.createElement("div");
      player.id = "movie_player";
      document.body.appendChild(player);

      const callback = vi.fn();
      const cleanup = onSubtitlesToggled(callback);
      expect(cleanup).toBeTypeOf("function");

      const container = document.createElement("div");
      container.id = "ytp-caption-window-container";
      player.appendChild(container);

      await new Promise((r) => setTimeout(r, 50));
      expect(callback).toHaveBeenCalledWith(container);

      cleanup!();
    });

    it("calls callback with null when caption container is removed", async () => {
      const player = document.createElement("div");
      player.id = "movie_player";
      document.body.appendChild(player);

      const container = document.createElement("div");
      container.id = "ytp-caption-window-container";
      player.appendChild(container);

      const callback = vi.fn();
      const cleanup = onSubtitlesToggled(callback);

      player.removeChild(container);

      await new Promise((r) => setTimeout(r, 50));
      expect(callback).toHaveBeenCalledWith(null);

      cleanup!();
    });

    it("cleanup disconnects observer", async () => {
      const player = document.createElement("div");
      player.id = "movie_player";
      document.body.appendChild(player);

      const callback = vi.fn();
      const cleanup = onSubtitlesToggled(callback)!;
      cleanup();

      const container = document.createElement("div");
      container.id = "ytp-caption-window-container";
      player.appendChild(container);

      await new Promise((r) => setTimeout(r, 50));
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
