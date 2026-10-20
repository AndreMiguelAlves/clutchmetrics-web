"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";
import VideoFrameThumbnail from "@/components/VideoFrameThumbnail";
import ClipToast from "@/components/ClipToast";

const clipGameImages: Record<string, string> = {
    "League of Legends": "/games/lol.png",
    Valorant: "/games/valorant.png",
    "Counter-Strike 2": "/games/cs2.png",
    "Rocket League": "/games/rocket-league.png",
};

interface ClipResponse {
    id: number;
    gameCode: string | null;
    gameName: string | null;
    title: string;
    description: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
    visibility: "PUBLIC" | "PRIVATE";
    createdAt: string;
    updatedAt: string;
    likeCount?: number;
    commentCount?: number;
}


function isLocalMp4(videoUrl: string | null | undefined): boolean {
    if (!videoUrl) return false;

    try {
        const url = new URL(videoUrl, "http://localhost:3000");

        return (
            url.origin === "http://localhost:3000" &&
            url.pathname.startsWith("/videos/") &&
            url.pathname.toLowerCase().endsWith(".mp4")
        );
    } catch {
        return false;
    }
}


export default function ClipsPage() {
    const router = useRouter();

    const [clips, setClips] =
        useState<ClipResponse[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [creating, setCreating] =
        useState(false);

    const [showForm, setShowForm] =
        useState(false);

    const [gameCode, setGameCode] =
        useState("");

    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [videoUrl, setVideoUrl] =
        useState("");

    const [thumbnailUrl, setThumbnailUrl] =
        useState("");

    const [durationSeconds, setDurationSeconds] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");
    const [actionClipId, setActionClipId] =
        useState<number | null>(null);
    const [clipToDelete, setClipToDelete] = useState<ClipResponse | null>(null);
    const [clipToExport, setClipToExport] =
        useState<ClipResponse | null>(null);
    const [clipSearch, setClipSearch] = useState("");
    const [visibilityFilter, setVisibilityFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");



    useEffect(() => {
        if (clipToDelete || (!error && !success)) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setError("");
            setSuccess("");
        }, 10000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success, clipToDelete]);



    useEffect(() => {
        const url = videoUrl.trim();

        if (!/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(url)) {
            return;
        }

        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
            const seconds = video.duration;

            if (Number.isFinite(seconds) && seconds > 0) {
                setDurationSeconds(String(Math.ceil(seconds)));
            }
        };

        video.src = url;
        video.load();

        return () => {
            video.onloadedmetadata = null;
            video.removeAttribute("src");
            video.load();
        };
    }, [videoUrl]);


    useEffect(() => {
        async function fetchClips() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/clips/me"
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar os clips."
                    );
                }

                const data: ClipResponse[] =
                    await response.json();

                setClips(data);
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

                setError("Could not load your clips.");
            } finally {
                setLoading(false);
            }
        }

        void fetchClips();
    }, [router]);

    async function handleCreateClip() {

        if (!gameCode) {
            setError("Please select a game before creating a clip.");
            return;
        }

        if (!title.trim()) {
            setError("Title is required.");
            return;
        }

        if (!videoUrl.trim()) {
            setError("Video URL is required.");
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/clips",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gameCode: gameCode,

                        title: title.trim(),

                        description:
                            description.trim() || null,

                        videoUrl:
                            videoUrl.trim(),

                        thumbnailUrl:
                            thumbnailUrl.trim() || null,

                        durationSeconds:
                            durationSeconds
                                ? Number(durationSeconds)
                                : null,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not create the clip."
                );
            }

            const newClip: ClipResponse =
                await response.json();

            setClips((current) => [
                newClip,
                ...current,
            ]);

            setGameCode("");
            setTitle("");
            setDescription("");
            setVideoUrl("");
            setThumbnailUrl("");
            setDurationSeconds("");

            setShowForm(false);

            setSuccess(
                "Clip created successfully."
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
                    : "Could not create the clip."
            );
        } finally {
            setCreating(false);
        }
    }

    async function handleClipAction(
        clipId: number,
        action: "process" | "publish" | "unpublish"
    ) {
        setActionClipId(clipId);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clipId}/${action}`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not update the clip."
                );
            }

            const updatedClip: ClipResponse =
                await response.json();

            setClips((current) =>
                current.map((clip) =>
                    clip.id === clipId
                        ? updatedClip
                        : clip
                )
            );

            if (action === "process") {
                setSuccess("Clip processed successfully.");
            }

            if (action === "publish") {
                setSuccess("Clip published successfully.");
            }

            if (action === "unpublish") {
                setSuccess("Clip unpublished successfully.");
            }
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
                    : "Could not update the clip."
            );
        } finally {
            setActionClipId(null);
        }
    }


    async function handleDeleteClip(clip: ClipResponse): Promise<void> {
        setActionClipId(clip.id);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clip.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("SESSION_EXPIRED");
                }

                if (response.status === 403) {
                    throw new Error(
                        "You don't have permission to delete this clip."
                    );
                }

                if (response.status === 404) {
                    throw new Error("Clip not found.");
                }

                throw new Error(
                    "Could not delete the clip. Please try again."
                );
            }

            setClips((current) =>
                current.filter((item) => item.id !== clip.id)
            );

            setSuccess("Clip deleted successfully.");
            setClipToDelete(null);
        } catch (error) {
            console.error(error);

            if (
                error instanceof Error &&
                (error.message === "SESSION_EXPIRED" ||
                    error.message === "NO_ACCESS_TOKEN")
            ) {
                router.replace("/login");
                return;
            }

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not delete the clip."
            );
        } finally {
            setActionClipId(null);
        }
    }


    function formatDate(value: string) {
        return new Date(value).toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }


    const filteredClips = clips.filter((clip) => {
        const search = clipSearch.trim().toLowerCase();

        const matchesSearch =
            clip.title.toLowerCase().includes(search) ||
            (clip.description ?? "").toLowerCase().includes(search) ||
            (clip.gameName ?? "").toLowerCase().includes(search);

        const matchesVisibility =
            visibilityFilter === "ALL" ||
            clip.visibility === visibilityFilter;

        const matchesStatus =
            statusFilter === "ALL" ||
            clip.status === statusFilter;

        return matchesSearch && matchesVisibility && matchesStatus;
    });


    return (
        <AppShell title="Clips">
            <div className="clips-page">

                <header className="clips-header">
                    <div>
                        <p className="eyebrow">
                            CREATOR STUDIO
                        </p>

                        <h1>My clips</h1>

                        <p>
                            Create, process and publish your
                            competitive highlights.
                        </p>
                    </div>

                    <button
                        className="clips-create-button"
                        onClick={() =>
                            setShowForm(!showForm)
                        }
                    >
                        {showForm
                            ? "Cancel"
                            : "+ New clip"}
                    </button>
                </header>

                {showForm && (
                    <section className="clip-create-panel">
                        <h2>Create clip</h2>

                        <div className="clip-form-grid">

                            <div className="profile-field">
                                <label>Game</label>

                                <select
                                    value={gameCode}
                                    onChange={(event) =>
                                        setGameCode(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        No game
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
                                <label>Title</label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Pentakill with Jinx"
                                />
                            </div>

                            <div className="profile-field clip-form-full">
                                <label>Description</label>

                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Describe the highlight..."
                                />
                            </div>

                            <div className="profile-field">
                                <label>Video URL</label>

                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(event) =>
                                        setVideoUrl(
                                            event.target.value
                                        )
                                    }
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="profile-field">
                                <label>Thumbnail URL</label>

                                <input
                                    type="text"
                                    value={thumbnailUrl}
                                    onChange={(event) =>
                                        setThumbnailUrl(
                                            event.target.value
                                        )
                                    }
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Duration in seconds
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={durationSeconds}
                                    onChange={(event) =>
                                        setDurationSeconds(
                                            event.target.value
                                        )
                                    }
                                    placeholder="27"
                                />
                            </div>

                        </div>

                        <div className="clip-form-actions">
                            <button
                                type="button"
                                className="profile-save-button"
                                disabled={creating}
                                onClick={handleCreateClip}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create clip"}
                            </button>
                        </div>
                    </section>
                )}


                {!showForm && !loading && clips.length > 0 && (
                    <div className="clips-discovery">

                        <input
                            type="search"
                            className="clips-search-input"
                            placeholder="Search your clips by title, description or game..."
                            value={clipSearch}
                            onChange={(event) => setClipSearch(event.target.value)}
                        />

                        <div className="clips-filter-controls">

                            <select
                                value={visibilityFilter}
                                onChange={(event) => setVisibilityFilter(event.target.value)}
                                aria-label="Filter clips by visibility"
                            >
                                <option value="ALL">All visibility</option>
                                <option value="PUBLIC">Public</option>
                                <option value="PRIVATE">Private</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                aria-label="Filter clips by status"
                            >
                                <option value="ALL">All statuses</option>
                                <option value="READY">Ready</option>
                                <option value="UPLOADED">Uploaded</option>
                            </select>

                        </div>

                    </div>
                )}


                {loading ? (
                    <div className="matches-empty">
                        Loading clips...
                    </div>
                ) : clips.length === 0 ? (
                    <div className="matches-empty">
                        {"You haven't created any clips yet."}
                    </div>
                ) : (
                    <section className="clips-grid">
                        {filteredClips.length === 0 && (
                            <div className="clips-filter-empty">
                                No clips match your search or filters.
                            </div>
                        )}
                        {filteredClips.map((clip: ClipResponse) => (
                            <article
                                className="clip-card"
                                key={clip.id}
                            >
                                <div className="clip-thumbnail">
  <span className="feed-game-poster">
  <span
      className="feed-game-poster-backdrop"
      style={{
          backgroundImage: `url(${
              clipGameImages[clip.gameName ?? ""] ??
              "/clutchmetrics-icon.png"
          })`,
      }}
  />

  <span
      className="feed-game-poster-logo"
      style={{
          backgroundImage: `url(${
              clipGameImages[clip.gameName ?? ""] ??
              "/clutchmetrics-icon.png"
          })`,
      }}
  />

  <span className="feed-game-poster-text">
    {clip.gameName ?? "ClutchMetrics"}
  </span>
</span>

                                    <VideoFrameThumbnail videoUrl={clip.videoUrl} />

                                    {clip.thumbnailUrl && (
                                        <img
                                            src={clip.thumbnailUrl}
                                            alt={clip.title}
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    )}

                                    {clip.durationSeconds != null && (
                                        <small>
                                            {clip.durationSeconds}s
                                        </small>
                                    )}
                                </div>

                                <div className="clip-card-content">
                                    <div className="clip-card-top">
                    <span className="clip-game-label">
  {clipGameImages[clip.gameName ?? ""] && (
      <img
          src={clipGameImages[clip.gameName ?? ""]}
          alt={`${clip.gameName} logo`}
          className="clip-game-logo"
      />
  )}

                        {clip.gameName ?? "No game"}
</span>

                                        <span
                                            className={`clip-status ${clip.status.toLowerCase()}`}
                                        >
                      {clip.status}
                    </span>
                                    </div>

                                    <h2>{clip.title}</h2>

                                    <p>
                                        {clip.description ||
                                            "No description."}
                                    </p>

                                    <div className="clip-meta">
                    <span>
                      {clip.visibility}
                    </span>

                                        <span>
                      {formatDate(
                          clip.createdAt
                      )}
                    </span>
                                    </div>
                                    <div className="clip-actions">

                                        {clip.status === "UPLOADED" && (
                                            <button
                                                type="button"
                                                disabled={actionClipId === clip.id}
                                                onClick={() =>
                                                    handleClipAction(
                                                        clip.id,
                                                        "process"
                                                    )
                                                }
                                            >
                                                {actionClipId === clip.id
                                                    ? "Processing..."
                                                    : "Process clip"}
                                            </button>
                                        )}

                                        {clip.status === "READY" &&
                                            clip.visibility === "PRIVATE" && (
                                                <button
                                                    type="button"
                                                    className="clip-primary-action"
                                                    disabled={actionClipId === clip.id}
                                                    onClick={() =>
                                                        handleClipAction(
                                                            clip.id,
                                                            "publish"
                                                        )
                                                    }
                                                >
                                                    {actionClipId === clip.id
                                                        ? "Publishing..."
                                                        : "Publish"}
                                                </button>
                                            )}

                                        {clip.status === "READY" &&
                                            clip.visibility === "PUBLIC" && (
                                                <button
                                                    type="button"
                                                    disabled={actionClipId === clip.id}
                                                    onClick={() =>
                                                        handleClipAction(
                                                            clip.id,
                                                            "unpublish"
                                                        )
                                                    }
                                                >
                                                    {actionClipId === clip.id
                                                        ? "Updating..."
                                                        : "Unpublish"}
                                                </button>
                                            )}


                                        {clip.status === "READY" && isLocalMp4(clip.videoUrl) && (
                                            <button
                                                type="button"
                                                className="clip-export-button"
                                                disabled={actionClipId === clip.id}
                                                onClick={() => setClipToExport(clip)}
                                            >
                                                Export
                                            </button>
                                        )}



                                        <button
                                            type="button"
                                            className="clip-delete-button"
                                            disabled={actionClipId === clip.id}
                                            onClick={() => setClipToDelete(clip)}
                                        >
                                            {actionClipId === clip.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

            </div>

            {/* JANELA DE CONFIRMAÇÃO DELETE */}
            {clipToDelete && (
                <div className="clip-delete-modal-overlay">

                    <div
                        className="clip-delete-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-clip-title"
                        aria-describedby="delete-clip-description"
                    >
                        <div className="clip-delete-modal-icon">
                            !
                        </div>

                        <h2 id="delete-clip-title">
                            Delete clip?
                        </h2>

                        <p id="delete-clip-description">
                            Are you sure you want to delete{" "}
                            <strong>&quot;{clipToDelete.title}&quot;</strong>?
                        </p>

                        <p className="clip-delete-warning">
                            This action cannot be undone. The clip and its
                            associated likes and comments will be removed.
                        </p>

                        {error && (
                            <p className="clip-delete-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="clip-delete-modal-actions">
                            <button
                                type="button"
                                className="clip-delete-cancel"
                                disabled={actionClipId === clipToDelete.id}
                                onClick={() => setClipToDelete(null)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="clip-delete-confirm"
                                disabled={actionClipId === clipToDelete.id}
                                onClick={() => void handleDeleteClip(clipToDelete)}
                            >
                                {actionClipId === clipToDelete.id
                                    ? "Deleting..."
                                    : "Delete clip"}
                            </button>
                        </div>
                    </div>

                </div>
            )}


            {/* JANELA DE EXPORTAÇÃO */}
            {clipToExport && (
                <div className="clip-export-overlay">
                    <div
                        className="clip-export-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="clip-export-title"
                    >
                        <div className="clip-export-header">
                            <h2 id="clip-export-title">Export clip</h2>

                            <button
                                type="button"
                                className="clip-export-close"
                                onClick={() => setClipToExport(null)}
                                aria-label="Close export window"
                            >
                                ×
                            </button>
                        </div>

                        <div className="clip-export-info">
                            <img
                                src={
                                    clipToExport.thumbnailUrl ||
                                    clipGameImages[clipToExport.gameName ?? ""] ||
                                    "/clutchmetrics-icon.png"
                                }
                                alt={clipToExport.title}
                            />

                            <div>
                                <h3>{clipToExport.title}</h3>

                                <p>
                                    {clipToExport.gameName ?? "No game"}
                                    {" · "}
                                    {clipToExport.durationSeconds ?? 0} seconds
                                </p>

                                <span className="clip-export-ready">
            {clipToExport.status}
          </span>
                            </div>
                        </div>

                        <div className="clip-export-divider" />

                        <h3 className="clip-export-section-title">
                            Export format
                        </h3>

                        <div className="clip-export-formats">
                            <div className="clip-export-format clip-export-format-future">
                                <span className="clip-export-format-icon">▯</span>
                                <strong>Vertical · 9:16</strong>
                                <span>TikTok · Reels · Shorts</span>
                                <small>Coming soon</small>
                            </div>

                            <div className="clip-export-format clip-export-format-selected">
                                <span className="clip-export-format-icon">▣</span>
                                <strong>Original · MP4</strong>
                                <span>Keep original quality</span>
                                <small>Available for local MP4 files</small>
                            </div>
                        </div>

                        <a
                            className="clip-export-download"
                            href={clipToExport.videoUrl}
                            download={`clutchmetrics-clip-${clipToExport.id}.mp4`}
                        >
                            ↓ Download original
                        </a>

                        <p className="clip-export-note">
                            Original MP4 download is supported for videos hosted
                            locally by ClutchMetrics. Vertical export will be
                            available in a future update.
                        </p>
                    </div>
                </div>
            )}


            {!clipToDelete && (
                <>
                    {error ? (
                        <ClipToast
                            message={error}
                            type="error"
                            onClose={() => setError("")}
                        />
                    ) : success ? (
                        <ClipToast
                            message={success}
                            type="success"
                            onClose={() => setSuccess("")}
                        />
                    ) : null}
                </>
            )}


        </AppShell>
    );
}