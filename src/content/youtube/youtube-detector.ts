const YOUTUBE_HOSTS = ["www.youtube.com", "m.youtube.com", "youtube.com"];
const CAPTION_CONTAINER_ID = "ytp-caption-window-container";

export function isYouTubePage(): boolean {
  return YOUTUBE_HOSTS.includes(location.hostname);
}

export function isVideoPage(): boolean {
  return isYouTubePage() && location.pathname === "/watch";
}

export function findSubtitleContainer(): HTMLElement | null {
  return document.getElementById(CAPTION_CONTAINER_ID);
}

export function onSubtitlesToggled(
  callback: (container: HTMLElement | null) => void,
): (() => void) | null {
  const player = document.getElementById("movie_player");
  if (!player) return null;

  const observer = new MutationObserver(() => {
    callback(findSubtitleContainer());
  });

  observer.observe(player, { childList: true, subtree: true });

  return () => observer.disconnect();
}
