
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";

interface VideoAssetResponse {
    id: number;
    processed: boolean;
    createdAt: string;
}

export default function MyEditedVideos() {
    const router = useRouter();

    const [videos, setVideos] =
        useState<VideoAssetResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadVideos() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/clips/videos/me"
                );

                if (!response.ok) {
                    throw new Error("Could not load your videos.");
                }

                const data: VideoAssetResponse[] =
                    await response.json();

                setVideos(data);

            } catch (error) {
                console.error(error);

                if (
                    error instanceof Error &&
                    (
                        error.message === "SESSION_EXPIRED" ||
                        error.message === "NO_ACCESS_TOKEN"
                    )
                ) {
                    router.replace("/login");
                    return;
                }

                setError("Could not load your videos.");

            } finally {
                setLoading(false);
            }
        }

        void loadVideos();
    }, [router]);

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    return (
        <section className="clip-create-panel">
            <h2>My Videos</h2>

            <p>
                Access your uploaded and processed videos
                whenever you return to ClutchMetrics.
            </p>

            {loading && <p>Loading your videos...</p>}

            {error && <p role="alert">{error}</p>}

            {!loading && !error && videos.length === 0 && (
                <p>No videos uploaded yet.</p>
            )}

            {!loading && !error && videos.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gap: "12px",
                        marginTop: "20px",
                    }}
                >
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "12px",
                                padding: "16px",
                                border: "1px solid #253047",
                                borderRadius: "12px",
                            }}
                        >
                            <div>
                                <strong>Video #{video.id}</strong>

                                <p style={{ marginTop: "6px" }}>
                                    {formatDate(video.createdAt)}
                                </p>
                            </div>

                            <span>
                                {video.processed
                                    ? "Processed"
                                    : "Uploaded"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
