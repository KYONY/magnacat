import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pauseVideo, resumeVideo, isVideoPaused, resetVideoState } from "./video-controller";

function createVideo(paused = false): HTMLVideoElement {
  const video = document.createElement("video");
  Object.defineProperty(video, "paused", { writable: true, value: paused });
  video.pause = vi.fn(() => {
    (video as unknown as Record<string, boolean>).paused = true;
  });
  video.play = vi.fn(() => {
    (video as unknown as Record<string, boolean>).paused = false;
    return Promise.resolve();
  });
  document.body.appendChild(video);
  return video;
}

describe("video-controller", () => {
  beforeEach(() => {
    resetVideoState();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("pauseVideo calls video.pause()", () => {
    const video = createVideo(false);
    pauseVideo();
    expect(video.pause).toHaveBeenCalledOnce();
  });

  it("resumeVideo calls video.play() after pauseVideo", () => {
    const video = createVideo(false);
    pauseVideo();
    resumeVideo();
    expect(video.play).toHaveBeenCalledOnce();
  });

  it("pauseVideo does nothing when no video element", () => {
    expect(() => pauseVideo()).not.toThrow();
  });

  it("resumeVideo does nothing when no video element", () => {
    expect(() => resumeVideo()).not.toThrow();
  });

  it("isVideoPaused returns true when video is paused", () => {
    createVideo(true);
    expect(isVideoPaused()).toBe(true);
  });

  it("isVideoPaused returns false when video is playing", () => {
    createVideo(false);
    expect(isVideoPaused()).toBe(false);
  });

  it("isVideoPaused returns true when no video element", () => {
    expect(isVideoPaused()).toBe(true);
  });

  it("does not resume if video was already paused before pauseVideo", () => {
    const video = createVideo(true);
    pauseVideo();
    resumeVideo();
    expect(video.play).not.toHaveBeenCalled();
  });

  it("resetVideoState clears saved pause state", () => {
    const video = createVideo(true);
    pauseVideo();
    resetVideoState();
    resumeVideo();
    // After reset, wasPausedBeforeUs is false, so it will try to play
    expect(video.play).toHaveBeenCalledOnce();
  });
});
