
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";

interface DiscoverPlayer {
    userId: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export default function DiscoverPlayersPage() {
    const [search, setSearch] = useState("");
    const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const timeout = setTimeout(async () => {
            setLoading(true);
            setError("");

            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/players/discover?search=${encodeURIComponent(
                        search.trim()
                    )}`
                );

                if (!response.ok) {
                    throw new Error("Could not load players.");
                }

                const data: DiscoverPlayer[] =
                    await response.json();

                if (!cancelled) {
                    setPlayers(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setPlayers([]);
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Could not load players."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [search]);

    return (
        <AppShell title="Discover Players">
            <div className="discover-players-page">

                <header className="discover-players-header">
                    <p className="eyebrow">COMMUNITY</p>
                    <h1>Discover Players</h1>
                    <p>
                        Find gamers, explore their profiles and
                        connect with the ClutchMetrics community.
                    </p>
                </header>

                <section className="discover-players-panel">

                    <div className="discover-players-search">
                        <label htmlFor="player-search">
                            Search Players
                        </label>

                        <div className="discover-players-search-row">
                            <input
                                id="player-search"
                                type="text"
                                value={search}
                                maxLength={100}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by username or display name..."
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="discover-players-results-header">
                        <h2>Players</h2>

                        {!loading && !error && (
                            <span>
                                {players.length}{" "}
                                {players.length === 1
                                    ? "player found"
                                    : "players found"}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <p className="discover-players-message">
                            Loading players...
                        </p>
                    ) : error ? (
                        <p className="discover-players-error">
                            {error}
                        </p>
                    ) : players.length === 0 ? (
                        <p className="discover-players-message">
                            No players found. Try a different search.
                        </p>
                    ) : (
                        <div className="discover-players-list">
                            {players.map((player) => (
                                <Link
                                    key={player.userId}
                                    href={`/players/${player.userId}`}
                                    className="discover-player-card"
                                >
                                    <div className="discover-player-avatar">
                                        <span>
                                            {player.username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>

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

                                    <div className="discover-player-info">
                                        <strong>
                                            {player.displayName ||
                                                player.username}
                                        </strong>
                                        <span>
                                            @{player.username}
                                        </span>
                                    </div>

                                    <span className="discover-player-action">
                                        View Profile →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppShell>
    );
}
