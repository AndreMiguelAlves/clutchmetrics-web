
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import ClipToast from "@/components/ClipToast";

interface VideoUploadResponse {
    id: number;
    fileName: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface VideoEditorProps {
    onActiveVideoChange: (videoId: number | null) => void;
}

export default function VideoEditor({
                                        onActiveVideoChange,
                                    }: VideoEditorProps) {
    const router = useRouter();

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [uploading, setUploading] = useState(false);

    const [uploadedVideo, setUploadedVideo] =
        useState<VideoUploadResponse | null>(null);


    const [startSeconds, setStartSeconds] = useState("0");
    const [endSeconds, setEndSeconds] = useState("5");

    const [processing, setProcessing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processedVideo, setProcessedVideo] =
        useState<string | null>(null);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0] ?? null;

        setError("");
        setSuccessMessage("");
        setUploadedVideo(null);
        onActiveVideoChange(null);
        setProcessedVideo(null);
        setSelectedFile(null);
        setPreviewUrl(null);

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".mp4")) {
            setError("Please select an MP4 video.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("The video must not exceed 100 MB.");
            return;
        }

        setSelectedFile(file);
    }

    async function handleUpload() {
        if (!selectedFile || uploading) {
            return;
        }

        setUploading(true);
        setError("");
        setSuccessMessage("");

        try {
            const formData = new FormData();

            formData.append("file", selectedFile);

            const response = await authenticatedFetch(
                "http://localhost:8080/api/clips/videos/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(
                    response.status === 413
                        ? "The video exceeds the upload limit."
                        : "Could not upload the video."
                );
            }

            const data: VideoUploadResponse =
                await response.json();

            setUploadedVideo(data);
            onActiveVideoChange(data.id);
            window.dispatchEvent(
                new Event("clutchmetrics:video-updated")
            );
            setSuccessMessage(
                "Video uploaded successfully. Select an interval to continue."
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
                    : "An unexpected error occurred."
            );
        } finally {
            setUploading(false);
        }
    }


    async function handleProcessVideo() {
        if (!uploadedVideo || processing) {
            return;
        }

        const start = Number(startSeconds);
        const end = Number(endSeconds);

        if (
            startSeconds.trim() === "" ||
            endSeconds.trim() === "" ||
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start < 0 ||
            end <= start ||
            end - start > 60
        ) {
            setError(
                "Select a valid interval of up to 60 seconds."
            );
            return;
        }

        setProcessing(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${uploadedVideo.id}/process`,
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

            const data: {
                id: number;
                processedFileName: string;
                message: string;
            } = await response.json();

            setProcessedVideo(data.processedFileName);
            window.dispatchEvent(
                new Event("clutchmetrics:video-updated")
            );
            setSuccessMessage(
                "Your vertical video is ready! You can preview or download it."
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
                    : "An unexpected error occurred."
            );
        } finally {
            setProcessing(false);
        }
    }


    async function handleDownloadVideo() {
        if (!uploadedVideo || !processedVideo || downloading) {
            return;
        }

        setDownloading(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${uploadedVideo.id}/download`
            );

            if (!response.ok) {
                throw new Error(
                    "Could not download the processed video."
                );
            }

            // Receber o MP4 como ficheiro binário
            const blob = await response.blob();

            // Criar um endereço temporário para download
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `clutchmetrics-vertical-${uploadedVideo.id}.mp4`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 5000);

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
                    : "An unexpected error occurred."
            );

        } finally {
            setDownloading(false);
        }
    }


    async function handlePreviewVideo() {
        if (!uploadedVideo || !processedVideo || previewing || previewUrl) {
            return;
        }

        setPreviewing(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/videos/${uploadedVideo.id}/download`
            );

            if (!response.ok) {
                throw new Error("Could not load the video preview.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setPreviewUrl(url);

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
                    : "Could not load the video preview."
            );

        } finally {
            setPreviewing(false);
        }
    }


    return (

        <section className="clip-create-panel video-editor-panel">
            <div className="video-editor-heading">
                <div>
            <span className="video-editor-eyebrow">
                CLUTCHMETRICS STUDIO
            </span>

                    <h2>Video Editor</h2>

                    <p>
                        Turn your gameplay into vertical highlights
                        ready for Shorts, Reels and TikTok.
                    </p>
                </div>

                <div className="video-editor-format">
            <span className="video-editor-format-icon">
                ▯
            </span>

                    <div>
                        <strong>Vertical 9:16</strong>
                        <small>720 × 1280 · MP4</small>
                    </div>
                </div>
            </div>


            <div className="clip-form-grid">
                <div className="profile-field clip-form-full">
                    <label htmlFor="video-editor-file">
                        Source video
                    </label>


                    <input
                        id="video-editor-file"
                        type="file"
                        accept=".mp4,video/mp4"
                        className="video-editor-hidden-file"
                        onChange={handleFileChange}
                        disabled={uploading || processing || previewing}
                    />

                    <label
                        htmlFor="video-editor-file"
                        className="video-editor-file-picker"
                    >
    <span className="video-editor-choose-file">
        ↑ Choose MP4
    </span>

                        <span className="video-editor-file-name">
        {selectedFile
            ? selectedFile.name
            : "No file selected"}
    </span>
                    </label>


                    <small>
                        MP4 format · Maximum 100 MB
                    </small>
                </div>
            </div>


            {uploadedVideo && (
                <div className="clip-form-grid">
                    <div className="profile-field">
                        <label htmlFor="video-start">
                            Start (seconds)
                        </label>

                        <input
                            id="video-start"
                            type="number"
                            min="0"
                            step="1"
                            value={startSeconds}
                            disabled={processing || !!processedVideo}
                            onChange={(event) =>
                                setStartSeconds(event.target.value)
                            }
                        />
                    </div>

                    <div className="profile-field">
                        <label htmlFor="video-end">
                            End (seconds)
                        </label>

                        <input
                            id="video-end"
                            type="number"
                            min="1"
                            step="1"
                            value={endSeconds}
                            disabled={processing || !!processedVideo}
                            onChange={(event) =>
                                setEndSeconds(event.target.value)
                            }
                        />
                    </div>

                    <div className="clip-form-full">
                        <button
                            type="button"
                            className="profile-save-button"
                            disabled={processing || !!processedVideo}
                            onClick={() => void handleProcessVideo()}
                        >
                            {processing
                                ? "Processing video..."
                                : "Process Video"}
                        </button>
                    </div>
                </div>
            )}


            {processedVideo && (
                <div>

                    <button
                        type="button"
                        className="profile-save-button"
                        disabled={previewing}
                        onClick={() => void handlePreviewVideo()}
                        style={{ marginTop: "12px", marginRight: "12px" }}
                    >
                        {previewing
                            ? "Loading preview..."
                            : "Preview Video"}
                    </button>

                    {previewUrl && (
                        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                            <video
                                src={previewUrl}
                                controls
                                playsInline
                                preload="metadata"
                                style={{
                                    width: "100%",
                                    maxWidth: "300px",
                                    aspectRatio: "9 / 16",
                                    borderRadius: "12px",
                                    backgroundColor: "#000",
                                    display: "block",
                                }}
                            />
                        </div>
                    )}


                    <button
                        type="button"
                        className="profile-save-button"
                        disabled={downloading}
                        onClick={() => void handleDownloadVideo()}
                    >
                        {downloading
                            ? "Downloading..."
                            : "↓ Download Vertical MP4"}
                    </button>
                </div>
            )}



            <div className="clip-form-actions">
                <button
                    type="button"
                    className="profile-save-button"
                    disabled={!selectedFile || uploading || !!uploadedVideo}
                    onClick={() => void handleUpload()}
                >
                    {uploading
                        ? "Uploading..."
                        : "Upload video"}
                </button>
            </div>

            {error && (
                <ClipToast
                    message={error}
                    type="error"
                    onClose={() => setError("")}
                />
            )}

            {successMessage && (
                <ClipToast
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage("")}
                />
            )}

        </section>
    );
}
