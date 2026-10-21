
"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api";

interface VideoFrameThumbnailProps {
  videoUrl: string | null;
  requiresAuth?: boolean;
}

export default function VideoFrameThumbnail({
                                              videoUrl,
                                              requiresAuth = false,
                                            }: VideoFrameThumbnailProps) {
  const [frame, setFrame] = useState<{
    videoUrl: string;
    image: string;
  } | null>(null);


  useEffect(() => {
    if (
        !videoUrl ||
        !/(?:\.(?:mp4|webm|ogg)|\/api\/clips\/\d+\/video)(?:[?#].*)?$/i.test(videoUrl)
    ) {
      return;
    }
    const safeVideoUrl = videoUrl;


    const video = document.createElement("video");
    let cancelled = false;
    let objectUrl: string | null = null;

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


    async function loadVideo() {
      try {
        if (requiresAuth) {
          const response = await authenticatedFetch(safeVideoUrl);

          if (!response.ok) {
            return;
          }

          const blob = await response.blob();

          if (cancelled) {
            return;
          }

          objectUrl = URL.createObjectURL(blob);
          video.src = objectUrl;
        } else {
          video.src = safeVideoUrl;
        }

        if (!cancelled) {
          video.load();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Could not load video thumbnail:", error);
        }
      }
    }

    void loadVideo();

    return () => {
      cancelled = true;

      video.onloadedmetadata = null;
      video.onseeked = null;
      video.removeAttribute("src");
      video.load();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoUrl, requiresAuth]);


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
