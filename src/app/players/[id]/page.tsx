
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import VideoFrameThumbnail from "@/components/VideoFrameThumbnail";
import {
    FaYoutube,
    FaTwitch,
    FaTiktok,
    FaInstagram
} from "react-icons/fa6";
import { authenticatedFetch } from "@/lib/api";
import ClipToast from "@/components/ClipToast";


interface PublicPlayerProfile {
    userId: number;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    youtubeUrl: string | null;
    twitchUrl: string | null;
    tiktokUrl: string | null;
    instagramUrl: string | null;
}

interface UserFollowStats {
    followersCount: number;
    followingCount: number;
    following: boolean;
    ownProfile: boolean;
}

interface UserFollowPlayerResponse {
    userId: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}


interface PublicClip {
    id: number;
    authorId: number;
    title: string;
    gameCode: string | null;
    gameName: string | null;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    videoUrl: string | null;
}

const publicGameImages: Record<string, string> = {
    LEAGUE_OF_LEGENDS: "/games/lol.png",
    VALORANT: "/games/valorant.png",
    CS2: "/games/cs2.png",
};

export default function PublicPlayerPage() {
    const params = useParams<{ id: string }>();
    const userId = params.id;

    const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
    const [followStats, setFollowStats] =
        useState<UserFollowStats | null>(null);

    const [followListType, setFollowListType] =
        useState<"followers" | "following" | null>(null);

    const [followListPlayers, setFollowListPlayers] =
        useState<UserFollowPlayerResponse[]>([]);

    const [followListLoading, setFollowListLoading] =
        useState(false);

    const [followListError, setFollowListError] =
        useState("");

    const [followLoading, setFollowLoading] = useState(false);
    const [followError, setFollowError] = useState("");
    const [followSuccess, setFollowSuccess] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [publicClips, setPublicClips] = useState<PublicClip[]>([]);
    const [clipsLoading, setClipsLoading] = useState(true);
    const [clipsError, setClipsError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadProfile() {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/players/${userId}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? "Player profile not found."
                            : "Unable to load player profile."
                    );
                }

                const data: PublicPlayerProfile = await response.json();
                setProfile(data);
            } catch (err) {
                if (controller.signal.aborted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load player profile."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadProfile();

        return () => controller.abort();
    }, [userId]);


    useEffect(() => {
        const controller = new AbortController();

        async function loadPublicClips() {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/clips/players/${userId}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Unable to load player highlights.");
                }

                const data: PublicClip[] = await response.json();

                if (!controller.signal.aborted) {
                    setPublicClips(data);
                }
            } catch (error) {
                if (controller.signal.aborted) return;

                setClipsError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load player highlights."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setClipsLoading(false);
                }
            }
        }

        void loadPublicClips();

        return () => controller.abort();
    }, [userId]);


    useEffect(() => {
        let cancelled = false;

        async function loadFollowStats() {
            setFollowStats(null);

            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/follows/${userId}/stats`
                );

                if (!response.ok) {
                    throw new Error("Could not load follow stats.");
                }

                const data: UserFollowStats =
                    await response.json();

                if (!cancelled) {
                    setFollowStats(data);
                }

            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Could not load follow stats.",
                        error
                    );
                }
            }
        }

        void loadFollowStats();

        return () => {
            cancelled = true;
        };
    }, [userId]);


    async function handleToggleFollow() {
        if (
            !followStats ||
            followStats.ownProfile ||
            followLoading
        ) {
            return;
        }

        const alreadyFollowing = followStats.following;

        setFollowLoading(true);
        setFollowError("");
        setFollowSuccess("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/follows/${userId}`,
                {
                    method: alreadyFollowing
                        ? "DELETE"
                        : "POST",
                }
            );

            if (!response.ok) {
                throw new Error(
                    alreadyFollowing
                        ? "Could not unfollow this player."
                        : "Could not follow this player."
                );
            }

            setFollowStats((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    following: !alreadyFollowing,
                    followersCount: Math.max(
                        0,
                        current.followersCount +
                        (alreadyFollowing ? -1 : 1)
                    ),
                };
            });

            setFollowSuccess(
                alreadyFollowing
                    ? "Player unfollowed successfully."
                    : "You are now following this player."
            );

        } catch (error) {
            console.error(error);

            setFollowError(
                error instanceof Error
                    ? error.message
                    : "Could not update follow status."
            );

        } finally {
            setFollowLoading(false);
        }
    }


    async function handleOpenFollowList(
        type: "followers" | "following"
    ) {
        setFollowListType(type);
        setFollowListPlayers([]);
        setFollowListError("");
        setFollowListLoading(true);

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/follows/${userId}/${type}`
            );

            if (!response.ok) {
                throw new Error("Could not load players.");
            }

            const data: UserFollowPlayerResponse[] =
                await response.json();

            setFollowListPlayers(data);

        } catch (error) {
            console.error(error);

            setFollowListError(
                "Could not load the player list."
            );

        } finally {
            setFollowListLoading(false);
        }
    }


    return (
        <AppShell title="Player Profile">
            <div className="public-player-page">

                <header className="public-player-header">
                    <p className="eyebrow">COMMUNITY</p>
                    <h1>Player Profile</h1>
                    <p>Discover the player behind the highlights.</p>
                </header>

                {loading && <p>Loading player profile...</p>}

                {error && <p className="profile-error">{error}</p>}

                {profile && (
                    <section className="public-player-card">

                        <div className="public-player-avatar">
                            {profile.avatarUrl &&
                            !avatarFailed &&
                            !profile.avatarUrl.includes("example.com") ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt={profile.username}
                                    onError={() => setAvatarFailed(true)}
                                />
                            ) : (
                                profile.username.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="public-player-details">
                            <p className="public-player-label">
                                CLUTCHMETRICS PLAYER
                            </p>

                            <h2>{profile.displayName || profile.username}</h2>

                            <p className="public-player-username">
                                @{profile.username}
                            </p>

                            <p className="public-player-bio">
                                {profile.bio || "No biography available yet."}
                            </p>

                            {(
                                profile.youtubeUrl ||
                                profile.twitchUrl ||
                                profile.tiktokUrl ||
                                profile.instagramUrl
                            ) && (
                                <div className="public-player-social">
        <span className="public-player-social-title">
            CONNECT WITH THIS PLAYER
        </span>

                                    <div className="public-player-social-links">

                                        {profile.youtubeUrl && (
                                            <a
                                                href={profile.youtubeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="public-player-social-link"
                                            >
                                                <FaYoutube className="public-player-social-icon" />
                                                YouTube
                                            </a>
                                        )}

                                        {profile.twitchUrl && (
                                            <a
                                                href={profile.twitchUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="public-player-social-link"
                                            >
                                                <FaTwitch className="public-player-social-icon" />
                                                Twitch
                                            </a>
                                        )}

                                        {profile.tiktokUrl && (
                                            <a
                                                href={profile.tiktokUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="public-player-social-link"
                                            >
                                                <FaTiktok className="public-player-social-icon" />
                                                TikTok
                                            </a>
                                        )}

                                        {profile.instagramUrl && (
                                            <a
                                                href={profile.instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="public-player-social-link"
                                            >
                                                <FaInstagram className="public-player-social-icon" />
                                                Instagram
                                            </a>
                                        )}

                                    </div>
                                </div>
                            )}


                            {followStats && (
                                <>
                                    <div className="public-player-follow-stats">
                                        <button
                                            type="button"
                                            className="public-player-follow-stat-button"
                                            onClick={() =>
                                                void handleOpenFollowList("followers")
                                            }
                                        >
                                            <strong>{followStats.followersCount}</strong>
                                            <span>Followers</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="public-player-follow-stat-button"
                                            onClick={() =>
                                                void handleOpenFollowList("following")
                                            }
                                        >
                                            <strong>{followStats.followingCount}</strong>
                                            <span>Following</span>
                                        </button>
                                    </div>

                                    {!followStats.ownProfile && (
                                        <div className="public-player-follow-actions">
                                            <button
                                                type="button"
                                                className={`public-player-follow-button ${
                                                    followStats.following
                                                        ? "is-following"
                                                        : ""
                                                }`}
                                                disabled={followLoading}
                                                onClick={() =>
                                                    void handleToggleFollow()
                                                }
                                            >
                                                {followLoading
                                                    ? "Updating..."
                                                    : followStats.following
                                                        ? "✓ Following"
                                                        : "+ Follow Player"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}


                        </div>

                    </section>
                )}

                {profile && (
                    <section className="public-player-highlights">

                        <div className="public-player-highlights-header">
                            <h2>Published Highlights</h2>
                            <p>Explore this player&apos;s competitive moments.</p>
                        </div>

                        {!clipsLoading && !clipsError && (
                            <div className="public-player-stats">
                                <div className="public-player-stat">
                                    <strong>{publicClips.length}</strong>
                                    <span>Public Clips</span>
                                </div>

                                <div className="public-player-stat">
                                    <strong>
                                        {new Set(
                                            publicClips
                                                .map((clip) => clip.gameCode ?? clip.gameName)
                                                .filter(Boolean)
                                        ).size}
                                    </strong>
                                    <span>Games Featured</span>
                                </div>
                            </div>
                        )}

                        {clipsLoading ? (
                            <p className="public-player-clips-message">
                                Loading highlights...
                            </p>
                        ) : clipsError ? (
                            <p className="profile-error">{clipsError}</p>
                        ) : publicClips.length === 0 ? (
                            <p className="public-player-clips-message">
                                This player hasn&apos;t published any clips yet.
                            </p>
                        ) : (
                            <div className="public-player-clips-grid">
                                {publicClips.map((clip) => {
                                    const gameImage =
                                        publicGameImages[clip.gameCode ?? ""] ??
                                        "/clutchmetrics-icon.png";

                                    return (
                                        <Link
                                            key={clip.id}
                                            href={`/feed?clip=${clip.id}`}
                                            className="public-player-clip-card"
                                        >
                                            <div className="public-player-clip-art">
                                                <img
                                                    src={gameImage}
                                                    alt=""
                                                    className="public-player-clip-backdrop"
                                                />

                                                <img
                                                    src={gameImage}
                                                    alt={clip.gameName ?? "Game"}
                                                    className="public-player-clip-logo"
                                                />

                                                <VideoFrameThumbnail videoUrl={clip.videoUrl} />

                                                {clip.thumbnailUrl && (
                                                    <img
                                                        src={clip.thumbnailUrl}
                                                        alt={`${clip.title} thumbnail`}
                                                        className="public-player-clip-custom"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                )}

                                                {clip.durationSeconds != null && (
                                                    <span className="public-player-clip-duration">
                    {clip.durationSeconds}s
                  </span>
                                                )}
                                            </div>

                                            <div className="public-player-clip-info">
                                                <strong>{clip.title}</strong>
                                                <span>{clip.gameName ?? "No game"}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                    </section>
                )}


            </div>


            {followListType && (
                <div className="clip-delete-modal-overlay">
                    <div
                        className="clip-delete-modal public-player-follow-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="follow-list-title"
                    >
                        <div className="public-player-follow-modal-header">
                            <h2 id="follow-list-title">
                                {followListType === "followers"
                                    ? "Followers"
                                    : "Following"}
                            </h2>

                            <button
                                type="button"
                                onClick={() => setFollowListType(null)}
                                aria-label="Close player list"
                            >
                                ×
                            </button>
                        </div>

                        {followListLoading ? (
                            <p className="public-player-follow-message">
                                Loading players...
                            </p>
                        ) : followListError ? (
                            <p className="public-player-follow-error">
                                {followListError}
                            </p>
                        ) : followListPlayers.length === 0 ? (
                            <p className="public-player-follow-message">
                                {followListType === "followers"
                                    ? "No followers yet."
                                    : "Not following anyone yet."}
                            </p>
                        ) : (
                            <div className="public-player-follow-list">
                                {followListPlayers.map((player) => (
                                    <Link
                                        key={player.userId}
                                        href={`/players/${player.userId}`}
                                        className="public-player-follow-person"
                                        onClick={() =>
                                            setFollowListType(null)
                                        }
                                    >
                                        <div className="public-player-follow-avatar">
                                            {player.username
                                                .charAt(0)
                                                .toUpperCase()}

                                            {player.avatarUrl && (
                                                <img
                                                    src={player.avatarUrl}
                                                    alt=""
                                                    onError={(event) => {
                                                        event.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div className="public-player-follow-info">
                                            <strong>
                                                {player.displayName ||
                                                    player.username}
                                            </strong>
                                            <span>
                                    @{player.username}
                                </span>
                                        </div>

                                        <span
                                            className="public-player-follow-arrow"
                                            aria-hidden="true"
                                        >
                                →
                            </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {followError ? (
                <ClipToast
                    message={followError}
                    type="error"
                    onClose={() => setFollowError("")}
                />
            ) : followSuccess ? (
                <ClipToast
                    message={followSuccess}
                    type="success"
                    onClose={() => setFollowSuccess("")}
                />
            ) : null}

        </AppShell>
    );
}
