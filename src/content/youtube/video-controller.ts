let wasPausedBeforeUs = false;

function getVideo(): HTMLVideoElement | null {
  return document.querySelector("video");
}

export function pauseVideo(): void {
  const video = getVideo();
  if (!video) return;
  wasPausedBeforeUs = video.paused;
  if (!video.paused) {
    video.pause();
  }
}

export function resumeVideo(): void {
  const video = getVideo();
  if (!video) return;
  if (!wasPausedBeforeUs) {
    video.play();
  }
}

export function isVideoPaused(): boolean {
  const video = getVideo();
  return video?.paused ?? true;
}

export function resetVideoState(): void {
  wasPausedBeforeUs = false;
}
