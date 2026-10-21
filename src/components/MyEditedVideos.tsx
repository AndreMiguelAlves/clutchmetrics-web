
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import ClipToast from "@/components/ClipToast";


interface VideoAssetResponse {
    id: number;
    processed: boolean;
    createdAt: string;
    uploadedFileName: string | null;
}


interface MyEditedVideosProps {
    activeEditorVideoId: number | null;
}

export default function MyEditedVideos({
                                           activeEditorVideoId,
                                       }: MyEditedVideosProps) {
    const router = useRouter();

    const [videos, setVideos] =
        useState<VideoAssetResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] =
        useState<number | null>(null);
    const [previewingId, setPreviewingId] =
        useState<number | null>(null);

    const [previewVideo, setPreviewVideo] = useState<{
        id: number;
        url: string;
    } | null>(null);

    const [processingId, setProcessingId] =
        useState<number | null>(null);

    const [selectedVideoForClip, setSelectedVideoForClip] =
        useState<number | null>(null);

    const [clipTitle, setClipTitle] = useState("");
    const [clipDescription, setClipDescription] = useState("");
    const [clipGameCode, setClipGameCode] =
        useState("LEAGUE_OF_LEGENDS");
    const [creatingClip, setCreatingClip] = useState(false);
    const [clipCreateError, setClipCreateError] = useState("");
    const [clipCreateSuccess, setClipCreateSuccess] = useState("");


    const [videoRanges, setVideoRanges] = useState<
        Record<number, { start: string; end: string }>
    >({});


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

        const handleVideoUpdated = () => {
            void loadVideos();
        };

        window.addEventListener(
            "clutchmetrics:video-updated",
            handleVideoUpdated
        );

        return () => {
            window.removeEventListener(
                "clutchmetrics:video-updated",
                handleVideoUpdated
            );
        };
    }, [router]);



    useEffect(() => {
        return () => {
            if (previewVideo) {
                URL.revokeObjectURL(previewVideo.url);
            }
        };
    }, [previewVideo]);


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


    async function handleDownloadVideo(videoId: number) {
        if (downloadingId !== null) {
            return;
        }

        setDownloadingId(videoId);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${videoId}/download`
            );

            if (!response.ok) {
                throw new Error(
                    "Could not download the video."
                );
            }

            const blob = await response.blob();

            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `clutchmetrics-vertical-${videoId}.mp4`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 10000);

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

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not download the video."
            );

        } finally {
            setDownloadingId(null);
        }
    }


    async function handlePreviewVideo(videoId: number) {
        if (previewingId !== null) {
            return;
        }

        // Se o vídeo já estiver aberto, fechamos o leitor.
        if (previewVideo?.id === videoId) {
            setPreviewVideo(null);
            return;
        }

        setPreviewingId(videoId);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${videoId}/download`
            );

            if (!response.ok) {
                throw new Error("Could not load the video preview.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setPreviewVideo({
                id: videoId,
                url,
            });

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

            setError("Could not load the video preview.");

        } finally {
            setPreviewingId(null);
        }
    }


    async function handleProcessVideo(videoId: number) {
        if (processingId !== null) {
            return;
        }

        const range = videoRanges[videoId] ?? {
            start: "0",
            end: "5",
        };

        const start = Number(range.start);
        const end = Number(range.end);

        if (
            range.start.trim() === "" ||
            range.end.trim() === "" ||
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 0 ||
            end <= start ||
            end - start > 60
        ) {
            setError("Select a valid interval of up to 60 seconds.");
            return;
        }

        setProcessingId(videoId);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${videoId}/process`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        startSeconds: start,
                        endSeconds: end,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Could not process the video. Check the selected interval."
                );
            }

            // Atualizar o histórico sem precisar de F5
            setVideos((current) =>
                current.map((video) =>
                    video.id === videoId
                        ? { ...video, processed: true }
                        : video
                )
            );

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

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not process the video."
            );

        } finally {
            setProcessingId(null);
        }
    }


    async function handleCreateClip(videoId: number) {
        if (creatingClip) {
            return;
        }

        if (!clipTitle.trim()) {
            setClipCreateError("Please enter a clip title.");
            return;
        }

        setCreatingClip(true);
        setClipCreateError("");
        setClipCreateSuccess("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/clips/from-video",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        videoAssetId: videoId,
                        gameCode: clipGameCode,
                        title: clipTitle.trim(),
                        description: clipDescription.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Could not create the clip. Please try again."
                );
            }

            const createdClip: { id: number } =
                await response.json();

            setClipCreateSuccess(
                "Your clip was created successfully and is ready to publish."
            );
            window.dispatchEvent(
                new Event("clutchmetrics:clip-created")
            );

            // Fechar o formulário e limpar os campos
            setSelectedVideoForClip(null);
            setClipTitle("");
            setClipDescription("");
            setClipGameCode("LEAGUE_OF_LEGENDS");

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

            setClipCreateError(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred."
            );

        } finally {
            setCreatingClip(false);
        }
    }


    return (
        <section className="clip-create-panel my-videos-panel">
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
                            className="my-video-card"
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

                                <strong>
                                    {video.uploadedFileName?.trim() || "Previous upload"}
                                </strong>


                                <p style={{ marginTop: "6px" }}>
                                    {formatDate(video.createdAt)}
                                </p>
                            </div>


                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}
                            >

<span
    className={`my-video-status ${
        video.processed
            ? "my-video-status-processed"
            : "my-video-status-uploaded"
    }`}
>
    {video.processed ? "Processed" : "Uploaded"}
</span>

                                {video.processed && (
                                    <button
                                        type="button"
                                        className="profile-save-button my-video-preview-button"
                                        disabled={previewingId !== null}
                                        onClick={() => void handlePreviewVideo(video.id)}
                                    >
                                        {previewingId === video.id
                                            ? "Loading..."
                                            : previewVideo?.id === video.id
                                                ? "Close Preview"
                                                : "Preview"}
                                    </button>
                                )}

                                {video.processed && (
                                    <button
                                        type="button"
                                        className="profile-save-button my-video-download-button"
                                        disabled={downloadingId !== null}
                                        onClick={() =>
                                            void handleDownloadVideo(video.id)
                                        }
                                    >
                                        {downloadingId === video.id
                                            ? "Downloading..."
                                            : "↓ Download MP4"}
                                    </button>
                                )}

                                {video.processed && (
                                    <button
                                        type="button"
                                        className="profile-save-button my-video-use-button"
                                        onClick={() =>
                                            setSelectedVideoForClip((current) =>
                                                current === video.id ? null : video.id
                                            )
                                        }
                                    >
                                        {selectedVideoForClip === video.id
                                            ? "Cancel"
                                            : "Use in Clip"}
                                    </button>
                                )}

                            </div>

                            {previewVideo?.id === video.id && (
                                <div
                                    style={{
                                        flexBasis: "100%",
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        paddingTop: "12px",
                                    }}
                                >
                                    <video
                                        src={previewVideo.url}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        style={{
                                            width: "100%",
                                            maxWidth: "260px",
                                            aspectRatio: "9 / 16",
                                            backgroundColor: "#000",
                                            borderRadius: "12px",
                                        }}

                                    />
                                </div>
                            )}



                            {selectedVideoForClip === video.id && (
                                <div className="my-video-create-panel">
                                    <strong>Create Clip</strong>

                                    <p>
                                        Video #{video.id} selected.
                                        Add your clip details to prepare it for publishing.
                                    </p>

                                    <div
                                        className="clip-form-grid"
                                        style={{ marginTop: "20px" }}
                                    >
                                        <div className="profile-field">
                                            <label htmlFor={`clip-game-${video.id}`}>
                                                Game
                                            </label>

                                            <select
                                                id={`clip-game-${video.id}`}
                                                value={clipGameCode}
                                                onChange={(event) =>
                                                    setClipGameCode(event.target.value)
                                                }
                                            >
                                                <option value="LEAGUE_OF_LEGENDS">
                                                    League of Legends
                                                </option>
                                                <option value="VALORANT">
                                                    Valorant
                                                </option>
                                            </select>
                                        </div>

                                        <div className="profile-field">
                                            <label htmlFor={`clip-title-${video.id}`}>
                                                Clip title
                                            </label>

                                            <input
                                                id={`clip-title-${video.id}`}
                                                type="text"
                                                maxLength={150}
                                                placeholder="e.g. My best pentakill"
                                                value={clipTitle}
                                                onChange={(event) =>
                                                    setClipTitle(event.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="profile-field clip-form-full">
                                            <label htmlFor={`clip-description-${video.id}`}>
                                                Description (optional)
                                            </label>

                                            <textarea
                                                id={`clip-description-${video.id}`}
                                                rows={3}
                                                maxLength={1000}
                                                placeholder="Describe your highlight..."
                                                value={clipDescription}
                                                onChange={(event) =>
                                                    setClipDescription(event.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {clipCreateError && (
                                        <p role="alert" style={{ color: "#fca5a5" }}>
                                            {clipCreateError}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        className="profile-save-button"
                                        style={{ marginTop: "20px" }}
                                        disabled={creatingClip || !clipTitle.trim()}
                                        onClick={() => void handleCreateClip(video.id)}
                                    >
                                        {creatingClip
                                            ? "Creating Clip..."
                                            : "Create Clip"}
                                    </button>

                                </div>
                            )}



                            {!video.processed &&
                                video.id !== activeEditorVideoId && (
                                <div
                                    style={{
                                        flexBasis: "100%",
                                        width: "100%",
                                        borderTop: "1px solid #253047",
                                        paddingTop: "16px",
                                    }}
                                >
                                    <div className="clip-form-grid">
                                        <div className="profile-field">
                                            <label htmlFor={`video-start-${video.id}`}>
                                                Start (seconds)
                                            </label>

                                            <input
                                                id={`video-start-${video.id}`}
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={videoRanges[video.id]?.start ?? "0"}
                                                disabled={processingId !== null}
                                                onChange={(event) =>
                                                    setVideoRanges((current) => ({
                                                        ...current,
                                                        [video.id]: {
                                                            start: event.target.value,
                                                            end: current[video.id]?.end ?? "5",
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="profile-field">
                                            <label htmlFor={`video-end-${video.id}`}>
                                                End (seconds)
                                            </label>

                                            <input
                                                id={`video-end-${video.id}`}
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={videoRanges[video.id]?.end ?? "5"}
                                                disabled={processingId !== null}
                                                onChange={(event) =>
                                                    setVideoRanges((current) => ({
                                                        ...current,
                                                        [video.id]: {
                                                            start: current[video.id]?.start ?? "0",
                                                            end: event.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="profile-save-button"
                                        style={{ marginTop: "16px" }}
                                        disabled={processingId !== null}
                                        onClick={() => void handleProcessVideo(video.id)}
                                    >
                                        {processingId === video.id
                                            ? "Processing..."
                                            : "Process Video"}
                                    </button>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}

            {clipCreateSuccess && (
                <ClipToast
                    message={clipCreateSuccess}
                    type="success"
                    onClose={() => setClipCreateSuccess("")}
                />
            )}

        </section>
    );
}
