"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";

interface ClipResponse {
    id: number;
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

                {loading ? (
                    <div className="matches-empty">
                        Loading feed...
                    </div>
                ) : clips.length === 0 ? (
                    <div className="matches-empty">
                        No public clips available yet.
                    </div>
                ) : (
                    <section className="feed-list">
                        {clips.map((clip) => (
                            <article
                                className="feed-card"
                                key={clip.id}
                            >
                                <div className="feed-video">
                  <span className="clip-thumbnail-fallback">
                    CM
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

                                    {clip.durationSeconds != null && (
                                        <small>
                                            {clip.durationSeconds}s
                                        </small>
                                    )}
                                </div>

                                <div className="feed-card-content">

                                    <div className="feed-card-meta">
                    <span>
                      {clip.gameName ??
                          "No game"}
                    </span>

                                        <span>
                      {formatDate(
                          clip.createdAt
                      )}
                    </span>
                                    </div>

                                    <h2>{clip.title}</h2>

                                    <p>
                                        {clip.description ||
                                            "No description."}
                                    </p>

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
      {clip.commentCount ?? 0} Comments
    </span>
                                        </button>
                                    </div>
                                    {openCommentsClipId === clip.id && (
                                        <div className="feed-comments">

                                            {loadingComments ? (
                                                <p className="feed-comments-empty">
                                                    Loading comments...
                                                </p>
                                            ) : (commentsByClip[clip.id] ?? []).length === 0 ? (
                                                <p className="feed-comments-empty">
                                                    No comments yet.
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
                                                                    <div>
                                                                        <strong>
                                                                            {comment.username}
                                                                        </strong>

                                                                        <span>
        {new Date(
            comment.createdAt
        ).toLocaleString("en-GB")}
      </span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="feed-delete-comment"
                                                                        disabled={
                                                                            deletingCommentId === comment.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleDeleteComment(
                                                                                clip.id,
                                                                                comment.id
                                                                            )
                                                                        }
                                                                    >
                                                                        {deletingCommentId === comment.id
                                                                            ? "Deleting..."
                                                                            : "Delete"}
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
                    </section>
                )}

            </div>
        </AppShell>
    );
}