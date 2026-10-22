
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import VideoFrameThumbnail from "@/components/VideoFrameThumbnail";

interface PublicPlayerProfile {
    userId: number;
    username: string;
    displayName: string;
    bio: string | null;
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
        </AppShell>
    );
}
