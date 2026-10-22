
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

    const [selectedVideoForClip, setSelectedVideoForClip] =
        useState<number | null>(null);

    const [clipTitle, setClipTitle] = useState("");
    const [clipDescription, setClipDescription] = useState("");
    const [clipGameCode, setClipGameCode] = useState("");
    const [creatingClip, setCreatingClip] = useState(false);
    const [clipCreateError, setClipCreateError] = useState("");
    const [clipCreateSuccess, setClipCreateSuccess] = useState("");
    const [videoToDelete, setVideoToDelete] =
        useState<VideoAssetResponse | null>(null);
    const [deletingVideoId, setDeletingVideoId] =
        useState<number | null>(null);
    const [videoDeleteError, setVideoDeleteError] =
        useState("");
    const [videoDeleteSuccess, setVideoDeleteSuccess] = useState("");

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
            setClipGameCode("");

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


    async function handleDeleteVideo(video: VideoAssetResponse) {
        if (deletingVideoId !== null) {
            return;
        }

        if (video.id === activeEditorVideoId) {
            setVideoDeleteError(
                "Finish the current editing session before deleting this video."
            );
            return;
        }

        setDeletingVideoId(video.id);
        setVideoDeleteError("");
        setVideoDeleteSuccess("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${video.id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.status === 409) {
                throw new Error(
                    "This video is used by one or more clips. Remove those clips before deleting the video."
                );
            }

            if (response.status === 404) {
                throw new Error("Video not found.");
            }

            if (!response.ok) {
                throw new Error("Could not delete the video.");
            }

            // Remover o vídeo da lista sem F5
            setVideos((current) =>
                current.filter((item) => item.id !== video.id)
            );

            // Fechar o Preview, caso estivesse aberto
            if (previewVideo?.id === video.id) {
                setPreviewVideo(null);
            }

            if (selectedVideoForClip === video.id) {
                setSelectedVideoForClip(null);
            }

            // Fechar a confirmação
            setVideoToDelete(null);

            setVideoDeleteSuccess(
                "Video deleted successfully."
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

            setVideoDeleteError(
                error instanceof Error
                    ? error.message
                    : "Could not delete the video."
            );

        } finally {
            setDeletingVideoId(null);
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
                                            : "Create Feed Clip"}
                                    </button>
                                )}


                                <button
                                    type="button"
                                    className="clip-delete-button"
                                    disabled={
                                        deletingVideoId !== null ||
                                        video.id === activeEditorVideoId
                                    }
                                    onClick={() => {
                                        setVideoDeleteError("");
                                        setVideoDeleteSuccess("");
                                        setVideoToDelete(video);
                                    }}
                                >
                                    Delete
                                </button>


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

                                    <strong>Create Feed Clip</strong>

                                    <p>
                                        Selected video:{" "}
                                        <strong>
                                            {video.uploadedFileName?.trim() || "Previous upload"}
                                        </strong>
                                        . Create a private clip from this video.
                                        You can publish it to the community Feed when you're ready.
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
                                                <option value="" disabled>
                                                    Select a game
                                                </option>
                                                <option value="LEAGUE_OF_LEGENDS">
                                                    League of Legends
                                                </option>

                                                <option value="VALORANT">
                                                    Valorant
                                                </option>

                                                <option value="CS2">
                                                    Counter-Strike 2
                                                </option>

                                                <option value="ROCKET_LEAGUE">
                                                    Rocket League
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
                                        disabled={creatingClip || !clipTitle.trim() || !clipGameCode}
                                        onClick={() => void handleCreateClip(video.id)}
                                    >
                                        {creatingClip
                                            ? "Creating Feed Clip..."
                                            : "Create Feed Clip"}
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
                                        <button
                                            type="button"
                                            className="profile-save-button my-video-preview-button"
                                            onClick={() => {
                                                window.dispatchEvent(
                                                    new CustomEvent(
                                                        "clutchmetrics:resume-editing",
                                                        {
                                                            detail: {
                                                                id: video.id,
                                                                fileName:
                                                                    video.uploadedFileName?.trim() ||
                                                                    "Previous upload",
                                                            },
                                                        }
                                                    )
                                                );
                                            }}
                                        >
                                            Resume Editing
                                        </button>
                                    </div>
                                )}




                        </div>
                    ))}
                </div>
            )}


            {videoToDelete && (
                <div className="clip-delete-modal-overlay">
                    <div
                        className="clip-delete-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-video-title"
                        aria-describedby="delete-video-description"
                    >
                        <div className="clip-delete-modal-icon">
                            !
                        </div>

                        <h2 id="delete-video-title">
                            Delete video?
                        </h2>

                        <p id="delete-video-description">
                            Are you sure you want to delete{" "}
                            <strong>
                                {videoToDelete.uploadedFileName?.trim()
                                    || "this video"}
                            </strong>
                            ?
                        </p>

                        <p className="clip-delete-warning">
                            This action cannot be undone.
                            Videos associated with clips cannot be deleted.
                        </p>

                        {videoDeleteError && (
                            <p
                                className="clip-delete-error"
                                role="alert"
                            >
                                {videoDeleteError}
                            </p>
                        )}

                        <div className="clip-delete-modal-actions">
                            <button
                                type="button"
                                className="clip-delete-cancel"
                                disabled={deletingVideoId !== null}
                                onClick={() => {
                                    setVideoToDelete(null);
                                    setVideoDeleteError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="clip-delete-confirm"
                                disabled={deletingVideoId !== null}
                                onClick={() =>
                                    void handleDeleteVideo(videoToDelete)
                                }
                            >
                                {deletingVideoId !== null
                                    ? "Deleting..."
                                    : "Delete video"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {clipCreateSuccess && (
                <ClipToast
                    message={clipCreateSuccess}
                    type="success"
                    onClose={() => setClipCreateSuccess("")}
                />
            )}

            {videoDeleteSuccess && (
                <ClipToast
                    message={videoDeleteSuccess}
                    type="success"
                    onClose={() => setVideoDeleteSuccess("")}
                />
            )}

        </section>
    );
}
