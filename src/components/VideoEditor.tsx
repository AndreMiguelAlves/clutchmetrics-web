
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import ClipToast from "@/components/ClipToast";

interface VideoUploadResponse {
    id: number;
    fileName: string;
}
interface VideoEditorSubscription {
    planCode: "FREE" | "PREMIUM";
    active: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface VideoEditorProps {
    onActiveVideoChange: (videoId: number | null) => void;
}

export default function VideoEditor({
                                        onActiveVideoChange,
                                    }: VideoEditorProps) {
    const router = useRouter();
    const [videoSubscription, setVideoSubscription] =
        useState<VideoEditorSubscription | null>(null);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);
    const [sourcePreviewUrl, setSourcePreviewUrl] =
        useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [uploadedVideo, setUploadedVideo] =
        useState<VideoUploadResponse | null>(null);
    const [showOriginalForm, setShowOriginalForm] =
        useState(false);
    const [originalClipGameCode, setOriginalClipGameCode] = useState("");
    const [originalClipTitle, setOriginalClipTitle] = useState("");
    const [originalClipDescription, setOriginalClipDescription] = useState("");

    const [showTrimForm, setShowTrimForm] = useState(false);

    const [trimClipGameCode, setTrimClipGameCode] = useState("");
    const [trimClipTitle, setTrimClipTitle] = useState("");
    const [trimClipDescription, setTrimClipDescription] = useState("");

    const [creatingTrimClip, setCreatingTrimClip] = useState(false);


    const [creatingOriginalClip, setCreatingOriginalClip] = useState(false);


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
    const sourceVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadVideoSubscription() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/subscription/me"
                );

                if (!response.ok) {
                    throw new Error("Could not load subscription.");
                }

                const data: VideoEditorSubscription =
                    await response.json();

                if (!cancelled) {
                    setVideoSubscription(data);
                }

            } catch (error) {
                if (cancelled) return;

                console.error(error);

                if (
                    error instanceof Error &&
                    (
                        error.message === "SESSION_EXPIRED" ||
                        error.message === "NO_ACCESS_TOKEN"
                    )
                ) {
                    router.replace("/login");
                }
            }
        }

        void loadVideoSubscription();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);


    useEffect(() => {
        if (!sourcePreviewUrl) {
            return;
        }

        return () => {
            URL.revokeObjectURL(sourcePreviewUrl);
        };
    }, [sourcePreviewUrl]);


    useEffect(() => {
        let cancelled = false;

        async function resumeVideo(
            videoId: number,
            fileName: string
        ) {
            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/clips/videos/${videoId}/original`
                );

                if (!response.ok) {
                    throw new Error("Could not load the original video.");
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (cancelled) {
                    URL.revokeObjectURL(url);
                    return;
                }

                setSelectedFile(null);
                setUploadedVideo({
                    id: videoId,
                    fileName,
                });

                setSourcePreviewUrl(url);
                setPreviewUrl(null);
                setProcessedVideo(null);

                setStartSeconds("0");
                setEndSeconds("5");

                onActiveVideoChange(videoId);
                setError("");
                setSuccessMessage("");

                document.querySelector(".video-editor-panel")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });

            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setError("Could not resume video editing.");
                }
            }
        }

        const handleResumeEditing = (event: Event) => {
            const detail = (
                event as CustomEvent<{
                    id: number;
                    fileName: string;
                }>
            ).detail;

            void resumeVideo(detail.id, detail.fileName);
        };

        window.addEventListener(
            "clutchmetrics:resume-editing",
            handleResumeEditing
        );

        return () => {
            cancelled = true;

            window.removeEventListener(
                "clutchmetrics:resume-editing",
                handleResumeEditing
            );
        };
    }, [onActiveVideoChange]);


    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0] ?? null;

        setError("");
        setSuccessMessage("");
        setUploadedVideo(null);
        setShowOriginalForm(false);
        onActiveVideoChange(null);
        setProcessedVideo(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setSourcePreviewUrl(null);

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
        setSourcePreviewUrl(URL.createObjectURL(file));
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
                "Video uploaded successfully! Choose Process Video to create a vertical highlight or Keep Original to preserve your video."
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

    async function handleCreateOriginalClip() {
        if (!uploadedVideo || creatingOriginalClip) {
            return;
        }

        // Validar os campos obrigatórios
        if (!originalClipGameCode) {
            setError("Please select a game.");
            return;
        }

        if (!originalClipTitle.trim()) {
            setError("Please enter a clip title.");
            return;
        }

        setCreatingOriginalClip(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/clips/from-original",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        videoAssetId: uploadedVideo.id,
                        gameCode: originalClipGameCode,
                        title: originalClipTitle.trim(),
                        description: originalClipDescription.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Could not create the original clip."
                );
            }

            // Atualizar My Clips automaticamente
            window.dispatchEvent(
                new Event("clutchmetrics:clip-created")
            );

            setSuccessMessage(
                "Your original clip is ready! You can find it in My Clips."
            );

            // Fechar e limpar o formulário
            setShowOriginalForm(false);
            setOriginalClipGameCode("");
            setOriginalClipTitle("");
            setOriginalClipDescription("");

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
            setCreatingOriginalClip(false);
        }
    }


    async function handleCreateTrimmedClip() {
        if (!uploadedVideo || creatingTrimClip) {
            return;
        }

        const start = Number(startSeconds);
        const end = Number(endSeconds);

        // Validar os dados do formulário
        if (!trimClipGameCode || !trimClipTitle.trim()) {
            setError("Please select a game and enter a clip title.");
            return;
        }

        // Validar o intervalo de corte
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

        setCreatingTrimClip(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/clips/from-trimmed",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        videoAssetId: uploadedVideo.id,
                        gameCode: trimClipGameCode,
                        title: trimClipTitle.trim(),
                        description: trimClipDescription.trim(),
                        startSeconds: start,
                        endSeconds: end,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Could not create the trimmed clip. Check the selected interval."
                );
            }

            // Atualizar a lista My Clips
            window.dispatchEvent(
                new Event("clutchmetrics:clip-created")
            );

            setSuccessMessage(
                "Trimmed clip created successfully! Find it in My Clips."
            );

            // Limpar e fechar o formulário
            setShowTrimForm(false);
            setTrimClipGameCode("");
            setTrimClipTitle("");
            setTrimClipDescription("");

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
            setCreatingTrimClip(false);
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
                "Your vertical video is ready! You can preview, download, or create a clip for the Feed."
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

    const isPremiumVideoExport =
        videoSubscription?.planCode === "PREMIUM" &&
        videoSubscription.active;

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
    <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect
            x="6"
            y="2"
            width="12"
            height="20"
            rx="2"
        />
        <line
            x1="10"
            y1="18"
            x2="14"
            y2="18"
        />
    </svg>
</span>



                    <div>
                        <strong>Vertical 9:16</strong>

                        <small>
                            {!videoSubscription
                                ? "Checking export quality..."
                                : isPremiumVideoExport
                                    ? "Full HD 1080p · 1080 × 1920 · MP4"
                                    : "HD 720p · 720 × 1280 · MP4"}
                        </small>

                        <small style={{ display: "block", marginTop: "4px" }}>
                            Applies to newly processed videos
                        </small>
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
            : uploadedVideo?.fileName ?? "No file selected"}
    </span>
                    </label>


                    <small>
                        MP4 format · Maximum 100 MB
                    </small>
                </div>
            </div>

            {sourcePreviewUrl && (
                <div className="video-editor-source-preview">
                    <h3>Original video preview</h3>

                    <p>
                        Review your gameplay before selecting
                        the start and end of your highlight.
                    </p>

                    <video
                        ref={sourceVideoRef}
                        src={sourcePreviewUrl}
                        controls
                        playsInline
                        preload="metadata"
                    >
                        Your browser does not support video playback.
                    </video>

                    <div
                        className="video-editor-timeline-actions"
                        style={{ display: showOriginalForm ? "none" : undefined }}
                    >
                        <button
                            type="button"
                            className="profile-save-button"
                            onClick={() => {
                                if (!sourceVideoRef.current) return;

                                const seconds = Math.floor(
                                    sourceVideoRef.current.currentTime
                                );

                                setStartSeconds(String(seconds));
                            }}
                        >
                            Set Start
                        </button>

                        <button
                            type="button"
                            className="profile-save-button"
                            onClick={() => {
                                if (!sourceVideoRef.current) return;

                                const seconds = Math.max(
                                    1,
                                    Math.ceil(sourceVideoRef.current.currentTime)
                                );

                                setEndSeconds(String(seconds));
                            }}
                        >
                            Set End
                        </button>
                    </div>


                    <div
                        className="video-editor-selected-range"
                        style={{ display: showOriginalForm ? "none" : undefined }}
                    >
    <span>
        Start: <strong>{startSeconds}s</strong>
    </span>

                        <span>
        End: <strong>{endSeconds}s</strong>
    </span>

                        <span>
        Duration: <strong>
            {Number(endSeconds) - Number(startSeconds)}s
        </strong>
    </span>
                    </div>

                </div>
            )}


            {uploadedVideo && (
                <div className="clip-form-grid">
                    <div
                        className="profile-field"
                        style={{ display: showOriginalForm ? "none" : undefined }}
                    >
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

                    <div
                        className="profile-field"
                        style={{ display: showOriginalForm ? "none" : undefined }}
                    >
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

                    <div
                        className="clip-form-full"
                        style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            className="profile-save-button"
                            style={{
                                display: showOriginalForm || showTrimForm ? "none" : undefined
                            }}
                            disabled={processing || !!processedVideo}
                            onClick={() => void handleProcessVideo()}
                        >
                            {processing
                                ? "Processing video..."
                                : "Process Video"}
                        </button>

                        <button
                            type="button"
                            className="profile-save-button my-video-preview-button"
                            disabled={processing || uploading}
                            onClick={() => {
                                setShowOriginalForm(current => !current);
                                setShowTrimForm(false);
                            }}
                        >
                            {showOriginalForm
                                ? "Cancel Keep Original"
                                : "Keep Original"}
                        </button>

                        <button
                            type="button"
                            className="profile-save-button"
                            disabled={creatingTrimClip}
                            onClick={() => {
                                setShowTrimForm(!showTrimForm);
                                setShowOriginalForm(false);
                                setError("");
                                setSuccessMessage("");
                            }}
                        >
                            {showTrimForm
                                ? "Cancel Trim Original"
                                : "Trim Original"}
                        </button>

                    </div>
                </div>
            )}


            {showOriginalForm && uploadedVideo && (
                <div
                    className="my-video-create-panel"
                    style={{ marginTop: "20px" }}
                >
                    <h3>Keep Original</h3>

                    <p>
                        Create a clip using your original MP4.
                        No trimming or video conversion required.
                    </p>

                    <div
                        className="clip-form-grid"
                        style={{ marginTop: "20px" }}
                    >
                        <div className="profile-field">
                            <label htmlFor="original-clip-game">
                                Game
                            </label>

                            <select
                                id="original-clip-game"
                                value={originalClipGameCode}
                                onChange={(event) =>
                                    setOriginalClipGameCode(event.target.value)
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
                            </select>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="original-clip-title">
                                Clip title
                            </label>

                            <input
                                id="original-clip-title"
                                type="text"
                                maxLength={150}
                                placeholder="e.g. My best Valorant clutch"
                                value={originalClipTitle}
                                onChange={(event) =>
                                    setOriginalClipTitle(event.target.value)
                                }
                            />
                        </div>

                        <div className="profile-field clip-form-full">
                            <label htmlFor="original-clip-description">
                                Description (optional)
                            </label>

                            <textarea
                                id="original-clip-description"
                                rows={3}
                                maxLength={1000}
                                placeholder="Describe your highlight..."
                                value={originalClipDescription}
                                onChange={(event) =>
                                    setOriginalClipDescription(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="profile-save-button"
                        style={{ marginTop: "20px" }}
                        disabled={
                            creatingOriginalClip ||
                            !originalClipGameCode ||
                            !originalClipTitle.trim()
                        }
                        onClick={() =>
                            void handleCreateOriginalClip()
                        }
                    >
                        {creatingOriginalClip
                            ? "Creating Original Clip..."
                            : "Create Original Clip"}
                    </button>
                </div>
            )}



            {uploadedVideo && showTrimForm && (
                <div
                    className="clip-form-grid"
                    style={{
                        marginTop: "20px",
                        padding: "20px",
                        border: "1px solid rgba(139, 92, 246, 0.35)",
                        borderRadius: "14px",
                        backgroundColor: "rgba(35, 25, 65, 0.35)",
                    }}
                >
                    <div className="clip-form-full">
                        <h3 style={{ margin: "0 0 10px" }}>
                            Trim Original
                        </h3>

                        <p
                            style={{
                                margin: "0",
                                color: "#a5b4d4",
                                fontSize: "14px",
                            }}
                        >
                            Cut your gameplay while keeping the original
                            aspect ratio and resolution.
                        </p>
                    </div>

                    <div className="profile-field">
                        <label htmlFor="trim-original-game">
                            Game
                        </label>

                        <select
                            id="trim-original-game"
                            value={trimClipGameCode}
                            onChange={(event) =>
                                setTrimClipGameCode(event.target.value)
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
                        </select>
                    </div>

                    <div className="profile-field">
                        <label htmlFor="trim-original-title">
                            Clip title
                        </label>

                        <input
                            id="trim-original-title"
                            type="text"
                            maxLength={150}
                            placeholder="Enter a clip title"
                            value={trimClipTitle}
                            onChange={(event) =>
                                setTrimClipTitle(event.target.value)
                            }
                        />
                    </div>

                    <div className="profile-field clip-form-full">
                        <label htmlFor="trim-original-description">
                            Description (optional)
                        </label>

                        <textarea
                            id="trim-original-description"
                            maxLength={1000}
                            rows={3}
                            placeholder="Describe your highlight (optional)"
                            value={trimClipDescription}
                            onChange={(event) =>
                                setTrimClipDescription(event.target.value)
                            }
                        />
                    </div>

                    <div className="clip-form-full">
                        <p>
                            Selected interval: {startSeconds}s to {endSeconds}s
                        </p>

                        <p>
                            The clip will keep the source video's
                            aspect ratio and resolution.
                        </p>

                        <button
                            type="button"
                            className="profile-save-button"
                            disabled={creatingTrimClip}
                            onClick={() =>
                                void handleCreateTrimmedClip()
                            }
                        >
                            {creatingTrimClip
                                ? "Creating trimmed clip..."
                                : "Create Trimmed Clip"}
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
