import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all dependencies
const mockObserveSubtitles = vi.fn(() => vi.fn());
const mockInitWordSelector = vi.fn();
const mockCleanupWordSelector = vi.fn();
const mockPauseVideo = vi.fn();
const mockResumeVideo = vi.fn();
const mockResetVideoState = vi.fn();
const mockCreateTooltip = vi.fn();
const mockRemoveTooltip = vi.fn();
const mockShowLoading = vi.fn();
const mockUpdateTooltipContent = vi.fn();
const mockSetOnCloseCallback = vi.fn();
const mockPlayAudio = vi.fn(() => vi.fn());
const mockIsYouTubePage = vi.fn(() => true);
const mockFindSubtitleContainer = vi.fn(() => null);
const mockOnSubtitlesToggled = vi.fn(() => vi.fn());

vi.mock("./subtitle-processor", () => ({
  observeSubtitles: (...args: unknown[]) => mockObserveSubtitles(...args),
}));

vi.mock("./word-selector", () => ({
  initWordSelector: (...args: unknown[]) => mockInitWordSelector(...args),
  cleanupWordSelector: (...args: unknown[]) => mockCleanupWordSelector(...args),
}));

vi.mock("./video-controller", () => ({
  pauseVideo: () => mockPauseVideo(),
  resumeVideo: () => mockResumeVideo(),
  resetVideoState: () => mockResetVideoState(),
}));

vi.mock("../tooltip", () => ({
  createTooltip: (...args: unknown[]) => mockCreateTooltip(...args),
  removeTooltip: () => mockRemoveTooltip(),
  showLoading: () => mockShowLoading(),
  updateTooltipContent: (...args: unknown[]) => mockUpdateTooltipContent(...args),
  setOnCloseCallback: (...args: unknown[]) => mockSetOnCloseCallback(...args),
}));

vi.mock("../../services/gemini-tts", () => ({
  playAudio: (...args: unknown[]) => mockPlayAudio(...args),
}));

vi.mock("./youtube-detector", () => ({
  isYouTubePage: () => mockIsYouTubePage(),
  findSubtitleContainer: () => mockFindSubtitleContainer(),
  onSubtitlesToggled: (...args: unknown[]) => mockOnSubtitlesToggled(...args),
}));

vi.mock("./subtitle-styles", () => ({
  injectSubtitleStyles: vi.fn(),
  removeSubtitleStyles: vi.fn(),
}));

import { initYouTubeIntegration, destroyYouTubeIntegration, isYouTubeIntegrationActive } from "./youtube-integration";

describe("youtube-integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsYouTubePage.mockReturnValue(true);
    mockFindSubtitleContainer.mockReturnValue(null);
    mockOnSubtitlesToggled.mockReturnValue(vi.fn());
    mockObserveSubtitles.mockReturnValue(vi.fn());

    // Reset module state by destroying first
    destroyYouTubeIntegration();
  });

  afterEach(() => {
    destroyYouTubeIntegration();
  });

  it("does not initialize on non-YouTube pages", () => {
    mockIsYouTubePage.mockReturnValue(false);
    initYouTubeIntegration();

    expect(mockOnSubtitlesToggled).not.toHaveBeenCalled();
    expect(isYouTubeIntegrationActive()).toBe(false);
  });

  it("initializes on YouTube page", () => {
    initYouTubeIntegration();

    expect(mockOnSubtitlesToggled).toHaveBeenCalled();
    expect(isYouTubeIntegrationActive()).toBe(true);
  });

  it("does not double-initialize", () => {
    initYouTubeIntegration();
    initYouTubeIntegration();

    expect(mockOnSubtitlesToggled).toHaveBeenCalledTimes(1);
  });

  it("attaches to existing subtitle container", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);

    initYouTubeIntegration();

    expect(mockObserveSubtitles).toHaveBeenCalledWith(container);
    expect(mockInitWordSelector).toHaveBeenCalledWith(container, expect.any(Function), expect.any(Function));
  });

  it("attaches when subtitle container appears via toggle", () => {
    initYouTubeIntegration();

    const toggleCallback = mockOnSubtitlesToggled.mock.calls[0][0];
    const container = document.createElement("div");
    toggleCallback(container);

    expect(mockObserveSubtitles).toHaveBeenCalledWith(container);
    expect(mockInitWordSelector).toHaveBeenCalledWith(container, expect.any(Function), expect.any(Function));
  });

  it("detaches when subtitle container disappears", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const toggleCallback = mockOnSubtitlesToggled.mock.calls[0][0];
    toggleCallback(null);

    expect(mockCleanupWordSelector).toHaveBeenCalled();
    expect(mockRemoveTooltip).toHaveBeenCalled();
  });

  it("word selection pauses video and shows tooltip", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const onWordSelected = mockInitWordSelector.mock.calls[0][1];
    onWordSelected({ text: "hello", context: "hello world" });

    expect(mockPauseVideo).toHaveBeenCalled();
    expect(mockCreateTooltip).toHaveBeenCalledWith(
      expect.any(Object),
      "",
      expect.objectContaining({
        onTts: expect.any(Function),
        onCopy: expect.any(Function),
      }),
    );
    expect(mockShowLoading).toHaveBeenCalled();
  });

  it("word selection sends DETECT_LANG and TRANSLATE messages", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const onWordSelected = mockInitWordSelector.mock.calls[0][1];
    onWordSelected({ text: "hello", context: "hello world" });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "DETECT_LANG", text: "hello" },
      expect.any(Function),
    );
  });

  it("tooltip close callback resumes video", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const onWordSelected = mockInitWordSelector.mock.calls[0][1];
    onWordSelected({ text: "hello", context: "hello world" });

    const closeCallback = mockSetOnCloseCallback.mock.calls[0][0];
    closeCallback();

    expect(mockResumeVideo).toHaveBeenCalled();
    expect(mockResetVideoState).toHaveBeenCalled();
  });

  it("selection cleared removes tooltip", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const onSelectionCleared = mockInitWordSelector.mock.calls[0][2];
    onSelectionCleared();

    expect(mockRemoveTooltip).toHaveBeenCalled();
  });

  it("destroy cleans up everything", () => {
    initYouTubeIntegration();
    destroyYouTubeIntegration();

    expect(mockCleanupWordSelector).toHaveBeenCalled();
    expect(mockRemoveTooltip).toHaveBeenCalled();
    expect(isYouTubeIntegrationActive()).toBe(false);
  });

  it("TTS callback plays audio via service worker", () => {
    const container = document.createElement("div");
    mockFindSubtitleContainer.mockReturnValue(container);
    initYouTubeIntegration();

    const onWordSelected = mockInitWordSelector.mock.calls[0][1];
    onWordSelected({ text: "hello", context: "hello world" });

    const callbacks = mockCreateTooltip.mock.calls[0][2];
    callbacks.onTts("hello");

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "TTS", text: "hello", voice: "Kore" },
      expect.any(Function),
    );
  });
});
