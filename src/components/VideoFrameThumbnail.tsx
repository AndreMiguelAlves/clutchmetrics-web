
"use client";

import { useEffect, useState } from "react";

interface VideoFrameThumbnailProps {
  videoUrl: string | null;
}

export default function VideoFrameThumbnail({
  videoUrl,
}: VideoFrameThumbnailProps) {
  const [frame, setFrame] = useState<{
    videoUrl: string;
    image: string;
  } | null>(null);

  useEffect(() => {
    if (
      !videoUrl ||
      !/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(videoUrl)
    ) {
      return;
    }

    const video = document.createElement("video");
    let cancelled = false;

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      if (
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }

      video.currentTime = Math.min(
        2,
        video.duration / 2
      );
    };

    video.onseeked = () => {
      if (cancelled || !video.videoWidth) return;

      const canvas = document.createElement("canvas");

      canvas.width = 640;
      canvas.height = Math.round(
        (640 * video.videoHeight) / video.videoWidth
      );

      const context = canvas.getContext("2d");

      if (!context) return;

      try {
        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const image = canvas.toDataURL(
          "image/jpeg",
          0.8
        );

        if (!cancelled) {
          setFrame({ videoUrl, image });
        }
      } catch {
        // Keep the existing gaming poster as fallback.
      }
    };

    video.src = videoUrl;
    video.load();

    return () => {
      cancelled = true;
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [videoUrl]);

  if (!frame || frame.videoUrl !== videoUrl) {
    return null;
  }

  return (
    <div
      className="clip-frame-thumbnail"
      role="img"
      aria-label="Video thumbnail"
      style={{
        backgroundImage: `url("${frame.image}")`,
      }}
    />
  );
}
