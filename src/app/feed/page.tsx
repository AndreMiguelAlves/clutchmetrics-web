"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";
import Link from "next/link";
import VideoFrameThumbnail from "@/components/VideoFrameThumbnail";
import ClipToast from "../../components/ClipToast";

const feedGameImages: Record<string, string> = {
    "League of Legends": "/games/lol.png",
    Valorant: "/games/valorant.png",
    "Counter-Strike 2": "/games/cs2.png",
};

interface ClipResponse {
    id: number;
    authorId: number;
    authorUsername: string;
    gameCode: string | null;
    gameName: string | null;
    title: string;
    description: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    status: string;
    visibility: string;
    createdAt: string;
    updatedAt: string;
    likeCount?: number;
    commentCount?: number;
    likedByCurrentUser: boolean;
}
interface ClipCommentResponse {
    id: number;
    userId: number;
    username: string;
    content: string;
    createdAt: string;
}

export default function FeedPage() {
    const router = useRouter();

    const [clips, setClips] =
        useState<ClipResponse[]>([]);

    const [selectedClipId, setSelectedClipId] =
        useState<number | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");
    const [likingClipId, setLikingClipId] =
        useState<number | null>(null);
    const [openCommentsClipId, setOpenCommentsClipId] =
        useState<number | null>(null);

    const [commentsByClip, setCommentsByClip] =
        useState<Record<number, ClipCommentResponse[]>>({});

    const [commentText, setCommentText] =
        useState("");

    const [loadingComments, setLoadingComments] =
        useState(false);

    const [postingComment, setPostingComment] =
        useState(false);
    const [deletingCommentId, setDeletingCommentId] =
        useState<number | null>(null);
    const [reportClipId, setReportClipId] = useState<number | null>(null);
    const [openMoreMenuClipId, setOpenMoreMenuClipId] =
        useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGame, setSelectedGame] = useState("ALL");
    const [reportReason, setReportReason] = useState("NOT_GAMING_RELATED");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [shareSuccess, setShareSuccess] = useState("");


    const feedGames = [
        { label: "All clips", value: "ALL" },
        { label: "League of Legends", value: "League of Legends" },
        { label: "Valorant", value: "Valorant" },
        { label: "CS2", value: "Counter-Strike 2" },
    ];

    const filteredClips = clips.filter((clip) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
            clip.title.toLowerCase().includes(search) ||
            (clip.gameName ?? "").toLowerCase().includes(search) ||
            (clip.description ?? "").toLowerCase().includes(search);

        const matchesGame =
            selectedGame === "ALL" ||
            clip.gameName === selectedGame;

        return matchesSearch && matchesGame;
    });

    const selectedClip =
        filteredClips.find(
            (clip) => clip.id === selectedClipId
        ) ?? filteredClips[0] ?? null;

    const upNextClips = filteredClips.filter(
        (clip) => clip.id !== selectedClip?.id
    );

    useEffect(() => {
        async function loadFeed() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/clips/feed"
                );

                if (!response.ok) {
                    throw new Error(
                        "Could not load the feed."
                    );
                }

                const data: ClipResponse[] =
                    await response.json();

                const requestedClipId = new URLSearchParams(
                    window.location.search
                ).get("clip");

                const matchingClip = data.find(
                    (clip) => String(clip.id) === requestedClipId
                );

                if (matchingClip) {
                    setSelectedClipId(matchingClip.id);
                }

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

                setError("Could not load the feed.");
            } finally {
                setLoading(false);
            }
        }

        void loadFeed();
    }, [router]);

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

    async function handleLike(clip: ClipResponse) {
        setLikingClipId(clip.id);
        setError("");

        const alreadyLiked = clip.likedByCurrentUser;

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clip.id}/like`,
                {
                    method: alreadyLiked ? "DELETE" : "POST",
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not update like."
                );
            }

            setClips((current) =>
                current.map((item) =>
                    item.id === clip.id
                        ? {
                            ...item,
                            likeCount: Math.max(
                                0,
                                (item.likeCount ?? 0) +
                                (alreadyLiked ? -1 : 1)
                            ),
                            likedByCurrentUser: !alreadyLiked,
                        }
                        : item
                )
            );
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update like."
            );
        } finally {
            setLikingClipId(null);
        }
    }


    async function handleSubmitReport(): Promise<void> {
        if (reportClipId === null || reportSubmitting) {
            return;
        }

        setReportSubmitting(true);
        setReportError("");
        setReportSuccess("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${reportClipId}/reports`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reason: reportReason,
                        details: reportDetails.trim() || null,
                    }),
                }
            );

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error(
                        "You have already reported this clip."
                    );
                }

                if (response.status === 400) {
                    throw new Error(
                        "This clip cannot be reported. Check that it is public and not your own."
                    );
                }

                if (response.status === 401 ||
                    response.status === 403) {
                    throw new Error(
                        "Please sign in again to report this clip."
                    );
                }

                throw new Error(
                    "Could not submit your report. Please try again."
                );
            }

            // Denúncia enviada com sucesso
            setReportSuccess(
                "Report submitted successfully. Our team will review it."
            );

            // Fechar e limpar o formulário
            setReportClipId(null);
            setReportReason("NOT_GAMING_RELATED");
            setReportDetails("");

        } catch (error) {
            console.error(error);

            setReportError(
                error instanceof Error
                    ? error.message
                    : "Could not submit your report."
            );

        } finally {
            setReportSubmitting(false);
        }
    }


    async function handleOpenComments(clipId: number) {
        if (openCommentsClipId === clipId) {
            setOpenCommentsClipId(null);
            return;
        }

        setOpenCommentsClipId(clipId);
        setCommentText("");

        if (commentsByClip[clipId]) {
            return;
        }

        setLoadingComments(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clipId}/comments`
            );

            if (!response.ok) {
                throw new Error(
                    "Could not load comments."
                );
            }

            const data: ClipCommentResponse[] =
                await response.json();

            setCommentsByClip((current) => ({
                ...current,
                [clipId]: data,
            }));
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load comments."
            );
        } finally {
            setLoadingComments(false);
        }
    }

    async function handleAddComment(clipId: number) {
        if (!commentText.trim()) {
            return;
        }

        setPostingComment(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clipId}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: commentText.trim(),
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not add comment."
                );
            }

            const newComment: ClipCommentResponse =
                await response.json();

            setCommentsByClip((current) => ({
                ...current,
                [clipId]: [
                    ...(current[clipId] ?? []),
                    newComment,
                ],
            }));

            setClips((current) =>
                current.map((clip) =>
                    clip.id === clipId
                        ? {
                            ...clip,
                            commentCount:
                                (clip.commentCount ?? 0) + 1,
                        }
                        : clip
                )
            );

            setCommentText("");
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not add comment."
            );
        } finally {
            setPostingComment(false);
        }
    }

    async function handleDeleteComment(
        clipId: number,
        commentId: number
    ) {
        setDeletingCommentId(commentId);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/clips/${clipId}/comments/${commentId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not delete comment."
                );
            }

            setCommentsByClip((current) => ({
                ...current,
                [clipId]: (
                    current[clipId] ?? []
                ).filter(
                    (comment) =>
                        comment.id !== commentId
                ),
            }));

            setClips((current) =>
                current.map((clip) =>
                    clip.id === clipId
                        ? {
                            ...clip,
                            commentCount: Math.max(
                                0,
                                (clip.commentCount ?? 0) - 1
                            ),
                        }
                        : clip
                )
            );
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not delete comment."
            );
        } finally {
            setDeletingCommentId(null);
        }
    }


    async function handleShare(clipId: number) {
        const clipUrl =
            `${window.location.origin}/feed?clip=${clipId}`;

        try {
            await navigator.clipboard.writeText(clipUrl);

            setShareSuccess("Clip link copied to clipboard!");
        } catch (error) {
            console.error(error);
            setError("Could not copy the clip link.");
        }
    }


    return (
        <AppShell title="Feed">
            <div className="feed-page">

                <header className="feed-header">
                    <p className="eyebrow">
                        COMMUNITY
                    </p>

                    <h1>Feed</h1>

                    <p>
                        Discover competitive highlights
                        from the ClutchMetrics community.
                    </p>
                </header>

                {error && (
                    <p className="profile-error">
                        {error}
                    </p>
                )}

                <div className="feed-discovery">
                    <div className="feed-search-box">
                        <input
                            type="search"
                            placeholder="Search clips or games..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <div className="feed-game-filters">
                        {feedGames.map((game) => (
                            <button
                                key={game.value}
                                type="button"
                                className={
                                    selectedGame === game.value
                                        ? "feed-game-filter active"
                                        : "feed-game-filter"
                                }
                                onClick={() => setSelectedGame(game.value)}
                            >
                                {game.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="matches-empty">
                        Loading feed...
                    </div>
                ) : filteredClips.length === 0 ? (
                    <div className="matches-empty">
                        No public clips available yet.
                    </div>
                ) : (
                    <section className="feed-watch-layout">
                        <div className="feed-list feed-watch-main">
                            {filteredClips
                                .filter((clip) => clip.id === selectedClip?.id)
                                .map((clip) => (
                            <article
                                className="feed-card"
                                key={clip.id}
                            >
                                <div className="feed-video">
                  <span className="feed-game-poster">
  <span
      className="feed-game-poster-backdrop"
      style={{
          backgroundImage: `url(${
              feedGameImages[clip.gameName ?? ""] ??
              "/clutchmetrics-icon.png"
          })`,
      }}
  />

  <span
      className="feed-game-poster-logo"
      style={{
          backgroundImage: `url(${
              feedGameImages[clip.gameName ?? ""] ??
              "/clutchmetrics-icon.png"
          })`,
      }}
  />

  <span className="feed-game-poster-text">
    {clip.gameName ?? "ClutchMetrics"}
  </span>
</span>

                                    {clip.thumbnailUrl && (
                                        <img
                                            src={clip.thumbnailUrl}
                                            alt={clip.title}
                                            onError={(event) => {
                                                event.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    )}


                                    {clip.videoUrl &&
                                        (
                                            /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(clip.videoUrl) ||
                                            /^http:\/\/localhost:8080\/api\/clips\/\d+\/video(?:[?#].*)?$/i.test(clip.videoUrl)
                                        ) && (
                                            <video
                                                key={clip.id}
                                                className="feed-video-player"
                                                src={clip.videoUrl}
                                                controls
                                                preload="metadata"
                                                playsInline
                                            >
                                                Your browser does not support video playback.
                                            </video>
                                        )}


                                    {clip.durationSeconds != null && (
                                        <small>
                                            {clip.durationSeconds}s
                                        </small>
                                    )}
                                </div>

                                <div className="feed-card-content">

                                    <div className="feed-card-meta">
                    <span className="clip-game-label">
  {feedGameImages[clip.gameName ?? ""] && (
      <img
          src={feedGameImages[clip.gameName ?? ""]}
          alt={`${clip.gameName} logo`}
          className="clip-game-logo"
      />
  )}

                        {clip.gameName ?? "No game"}
</span>

                                        <span>
                      {formatDate(
                          clip.createdAt
                      )}
                    </span>
                                    </div>


                                    <h2>{clip.title}</h2>

                                    {clip.description?.trim() &&
                                        clip.description.trim().toLowerCase() !==
                                        clip.title.trim().toLowerCase() && (
                                            <p className="feed-clip-description">
                                                {clip.description}
                                            </p>
                                        )}



                                    <Link
                                        href={`/players/${clip.authorId}`}
                                        className="feed-author"
                                        aria-label={`View ${clip.authorUsername}'s profile`}
                                    >
                                        <div className="feed-author-avatar">
                                            {(clip.authorUsername?.trim().charAt(0) || "P").toUpperCase()}
                                        </div>

                                        <div className="feed-author-info">
    <span className="feed-author-caption">
      Uploaded by
    </span>

                                            <strong className="feed-author-name">
                                                {clip.authorUsername || "Unknown player"}
                                            </strong>
                                        </div>
                                    </Link>


                                    <div className="feed-social">
                                        <button
                                            type="button"
                                            className={
                                                clip.likedByCurrentUser
                                                    ? "feed-like-button liked"
                                                    : "feed-like-button"
                                            }
                                            disabled={likingClipId === clip.id}
                                            onClick={() => handleLike(clip)}
                                        >
                                            <span className="feed-social-icon">♥</span>
                                            <span>{clip.likeCount ?? 0} Likes</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="feed-comment-button"
                                            onClick={() =>
                                                handleOpenComments(clip.id)
                                            }
                                        >
                                            <span className="feed-social-icon">💬</span>

                                            <span>
                                            {clip.commentCount ?? 0}{" "}
                                                    {(clip.commentCount ?? 0) === 1
                                                        ? "Comment"
                                                        : "Comments"}
                                            </span>


                                        </button>


                                        <button
                                            type="button"
                                            className="feed-comment-button"
                                            onClick={() => void handleShare(clip.id)}
                                            aria-label="Copy clip link"
                                        >
    <span className="feed-social-icon">
        ↗
    </span>
                                            <span>Share</span>
                                        </button>



                                        <div
                                            className="feed-more-menu"
                                            onBlur={(event) => {
                                                if (!event.currentTarget.contains(event.relatedTarget)) {
                                                    setOpenMoreMenuClipId(null);
                                                }
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="feed-more-button"
                                                aria-label="More clip options"
                                                aria-expanded={openMoreMenuClipId === clip.id}
                                                onClick={() =>
                                                    setOpenMoreMenuClipId((current) =>
                                                        current === clip.id ? null : clip.id
                                                    )
                                                }
                                            >
                                                ···
                                            </button>

                                            {openMoreMenuClipId === clip.id && (
                                                <div className="feed-more-dropdown">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenMoreMenuClipId(null);
                                                            setReportClipId(clip.id);
                                                        }}
                                                    >
                                                        <span aria-hidden="true">⚑</span>
                                                        Report clip
                                                    </button>
                                                </div>
                                            )}
                                        </div>



                                    </div>
                                    {openCommentsClipId === clip.id && (
                                        <div className="feed-comments">


                                            <div className="feed-comments-heading">
                                                <div>
                                                    <h3>Comments</h3>
                                                    <p>Join the conversation about this highlight.</p>
                                                </div>

                                                <span className="feed-comments-count">
        {clip.commentCount ?? 0}
    </span>
                                            </div>


                                            {loadingComments ? (
                                                <p className="feed-comments-empty">
                                                    Loading comments...
                                                </p>
                                            ) : (commentsByClip[clip.id] ?? []).length === 0 ? (
                                                <p className="feed-comments-empty">
                                                    No comments yet. Be the first to share your thoughts!
                                                </p>
                                            ) : (
                                                <div className="feed-comments-list">
                                                    {(commentsByClip[clip.id] ?? []).map(
                                                        (comment) => (
                                                            <div
                                                                className="feed-comment"
                                                                key={comment.id}
                                                            >
                                                                <div className="feed-comment-header">

                                                                    <div className="feed-comment-user">
                                                                        <div className="feed-comment-avatar">
                                                                            {(comment.username?.trim().charAt(0) || "P").toUpperCase()}
                                                                        </div>

                                                                        <div className="feed-comment-user-details">
                                                                            <strong>{comment.username}</strong>

                                                                            <span>
                                                                        {new Date(comment.createdAt).toLocaleString("en-GB")}
                                                                    </span>
                                                                        </div>
                                                                    </div>



                                                                    <button
                                                                        type="button"
                                                                        className="feed-delete-comment"
                                                                        disabled={deletingCommentId === comment.id}
                                                                        onClick={() =>
                                                                            handleDeleteComment(clip.id, comment.id)
                                                                        }
                                                                        style={{
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            gap: "9px",
                                                                            minHeight: "40px",
                                                                            padding: "10px 15px",
                                                                            borderRadius: "9px",
                                                                            border: "1px solid rgba(251, 113, 133, 0.4)",
                                                                            background: "rgba(251, 113, 133, 0.1)",
                                                                            color: "#fb7185",
                                                                            fontSize: "14px",
                                                                            fontWeight: 600,
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            width="19"
                                                                            height="19"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            aria-hidden="true"
                                                                            style={{ flexShrink: 0 }}
                                                                        >
                                                                            <path d="M3 6h18" />
                                                                            <path d="M8 6V4h8v2" />
                                                                            <path d="M19 6l-1 14H6L5 6" />
                                                                            <path d="M10 11v6" />
                                                                            <path d="M14 11v6" />
                                                                        </svg>

                                                                        <span style={{ fontSize: "14px" }}>
        {deletingCommentId === comment.id
            ? "Deleting..."
            : "Delete"}
    </span>
                                                                    </button>

                                                                </div>

                                                                <p>{comment.content}</p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            <div className="feed-comment-form">
                                                <input
                                                    type="text"
                                                    value={commentText}
                                                    onChange={(event) =>
                                                        setCommentText(event.target.value)
                                                    }
                                                    placeholder="Write a comment..."
                                                    maxLength={500}
                                                />

                                                <button
                                                    type="button"
                                                    disabled={
                                                        postingComment ||
                                                        !commentText.trim()
                                                    }
                                                    onClick={() =>
                                                        handleAddComment(clip.id)
                                                    }
                                                >
                                                    {postingComment
                                                        ? "Posting..."
                                                        : "Post"}
                                                </button>
                                            </div>

                                        </div>
                                    )}

                                </div>
                            </article>
                        ))}
                        </div>

                        <aside className="feed-up-next">
                            <h3>Up next</h3>

                            {upNextClips.length === 0 ? (
                                <p className="feed-up-next-empty">
                                    No more community clips available yet.
                                </p>
                            ) : (
                                <div className="feed-up-next-list">
                                    {upNextClips.map((clip) => (
                                        <button
                                            key={clip.id}
                                            type="button"
                                            className="feed-up-next-item"
                                            onClick={() => setSelectedClipId(clip.id)}
                                        >

                                            <div className="feed-up-next-thumb">
                                                <img
                                                    src={
                                                        feedGameImages[clip.gameName ?? ""] ??
                                                        "/clutchmetrics-icon.png"
                                                    }
                                                    alt={clip.gameName ?? "Game"}
                                                />

                                                <VideoFrameThumbnail videoUrl={clip.videoUrl} />

                                                {clip.thumbnailUrl && (
                                                    <img
                                                        src={clip.thumbnailUrl}
                                                        alt={`${clip.title} thumbnail`}
                                                        className="feed-up-next-custom-thumbnail"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                )}

                                                {clip.durationSeconds != null &&
                                                    clip.durationSeconds > 0 && (
                                                        <span className="feed-up-next-duration">
                                                {Math.floor(clip.durationSeconds / 60)}:
                                                            {String(clip.durationSeconds % 60).padStart(2, "0")}
                                                    </span>
                                                    )}

                                            </div>


                                            <div className="feed-up-next-info">
                                                <strong>{clip.title}</strong>

                                                <span>
                {clip.gameName ?? "No game"}
              </span>
                                                
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </aside>
                    </section>
                )}

            </div>


            {/* REPORT CLIP MODAL */}
            {reportClipId !== null && (
                <div className="feed-report-overlay">
                    <div
                        className="feed-report-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feed-report-title"
                    >
                        <div className="feed-report-header">
                            <h2 id="feed-report-title">
                                Report clip
                            </h2>

                            <button
                                type="button"
                                className="feed-report-close"
                                onClick={() => {
                                    setReportClipId(null);
                                    setReportReason("NOT_GAMING_RELATED");
                                    setReportDetails("");
                                }}
                                aria-label="Close report window"
                            >
                                ×
                            </button>
                        </div>

                        <p className="feed-report-description">
                            Help us keep the ClutchMetrics community safe.
                            Tell us why you are reporting this clip.
                        </p>

                        <div className="feed-report-divider" />

                        <h3 className="feed-report-label">
                            Reason
                        </h3>

                        <div className="feed-report-options">
                            {([
                                ["NOT_GAMING_RELATED", "Not gaming related"],
                                ["INAPPROPRIATE_CONTENT", "Inappropriate content"],
                                ["SPAM", "Spam"],
                                ["OTHER", "Other"],
                            ] as const).map(([value, label]) => (
                                <label
                                    className="feed-report-option"
                                    key={value}
                                >
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={value}
                                        checked={reportReason === value}
                                        onChange={() => setReportReason(value)}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>

                        <label
                            className="feed-report-label"
                            htmlFor="feed-report-details"
                        >
                            Additional details (optional)
                        </label>

                        <textarea
                            id="feed-report-details"
                            className="feed-report-textarea"
                            placeholder="Describe the issue..."
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            maxLength={500}
                            rows={4}
                        />

                        {reportError && (
                            <p className="feed-report-error" role="alert">
                                {reportError}
                            </p>
                        )}

                        <div className="feed-report-footer">
                            <button
                                type="button"
                                className="feed-report-cancel"
                                onClick={() => setReportClipId(null)}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="feed-report-submit"
                                onClick={handleSubmitReport}
                                disabled={reportSubmitting}
                            >
                                {reportSubmitting
                                    ? "Submitting..."
                                    : "Submit report"}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {reportSuccess && (
                <ClipToast
                    message={reportSuccess}
                    type="success"
                    onClose={() => setReportSuccess("")}
                />
            )}

            {shareSuccess && (
                <ClipToast
                    message={shareSuccess}
                    type="success"
                    onClose={() => setShareSuccess("")}
                />
            )}


        </AppShell>
    );
}