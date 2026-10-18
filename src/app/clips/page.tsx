"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";

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
                        gameCode:
                            gameCode || null,

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

                {error && (
                    <p className="profile-error">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="profile-success">
                        {success}
                    </p>
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
                        {clips.map((clip) => (
                            <article
                                className="clip-card"
                                key={clip.id}
                            >
                                <div className="clip-thumbnail">
  <span className="clip-thumbnail-fallback">
    CM
  </span>

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

                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

            </div>
        </AppShell>
    );
}