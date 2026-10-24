"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "../../lib/api";
import AppShell from "../../components/AppShell";

interface MatchResponse {
    matchId: number;
    playerGameAccountId: number;
    gameCode: string;
    gameName: string;
    nickname: string;
    externalMatchId: string;
    result: string;
    category?: "COMPETITIVE" | "CASUAL" | "UNKNOWN" | null;
    playedAt: string;
    durationSeconds: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    kda: number;
}

export default function MatchesPage() {
    const router = useRouter();

    const [matches, setMatches] =
        useState<MatchResponse[]>([]);

    const [loading, setLoading] =
        useState(true);
    const [selectedGame, setSelectedGame] =
        useState("ALL");

    const [selectedResult, setSelectedResult] =
        useState("ALL");
    const [selectedCategory, setSelectedCategory] =
        useState("ALL");

    useEffect(() => {
        async function loadMatches() {
            try {
                const params = new URLSearchParams();

                if (selectedGame !== "ALL") {
                    params.append("gameCode", selectedGame);
                }

                if (selectedResult !== "ALL") {
                    params.append("result", selectedResult);
                }

                const query = params.toString();

                const url = query
                    ? `http://localhost:8080/api/matches?${query}`
                    : "http://localhost:8080/api/matches";

                const response = await authenticatedFetch(
                    url,
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar os jogos."
                    );
                }

                const data: MatchResponse[] =
                    await response.json();

                setMatches(data);
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
                }
            } finally {
                setLoading(false);
            }
        }

        loadMatches();
    }, [router, selectedGame, selectedResult]);

    const filteredMatches = matches.filter((match) => {
        return (
            selectedCategory === "ALL" ||
            (match.category ?? "UNKNOWN") === selectedCategory
        );
    });

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
        <AppShell title="Matches">
            <div className="matches-page-container">

                <header className="matches-page-header">
                    <p className="eyebrow">
                        MATCH HISTORY
                    </p>

                    <h1>Matches</h1>

                    <p>
                        Explore your match history, results and performance across all games.
                    </p>
                </header>

                <div className="matches-filters">
                    <div>
                        <label>Game</label>

                        <select
                            value={selectedGame}
                            onChange={(event) =>
                                setSelectedGame(event.target.value)
                            }
                        >
                            <option value="ALL">
                                All games
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

                    <div>
                        <label>Result</label>

                        <select
                            value={selectedResult}
                            onChange={(event) =>
                                setSelectedResult(event.target.value)
                            }
                        >
                            <option value="ALL">
                                All results
                            </option>

                            <option value="WIN">
                                Wins
                            </option>

                            <option value="LOSS">
                                Losses
                            </option>

                            <option value="DRAW">
                                Draws
                            </option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="matches-category">
                            Category
                        </label>

                        <select
                            id="matches-category"
                            value={selectedCategory}
                            onChange={(event) =>
                                setSelectedCategory(event.target.value)
                            }
                        >
                            <option value="ALL">All categories</option>
                            <option value="COMPETITIVE">Competitive</option>
                            <option value="CASUAL">Casual</option>
                        </select>
                    </div>

                </div>

                {loading ? (
                    <div className="matches-empty">
                        Loading matches...
                    </div>
                ) : filteredMatches.length === 0 ? (
                    <div className="matches-empty">
                        No matches found for the selected filters.
                    </div>
                ) : (
                    <div className="matches-history">
                        {filteredMatches.map((match) => (
                            <article
                                className="matches-history-card"
                                key={match.matchId}
                            >
                                <div className="matches-history-game">
                                    <div className="game-icon game-badge-image">
                                        {(
                                            match.gameCode === "LEAGUE_OF_LEGENDS" ||
                                            match.gameCode === "VALORANT" ||
                                            match.gameCode === "CS2"
                                        ) && (
                                            <img
                                                src={
                                                    match.gameCode === "LEAGUE_OF_LEGENDS"
                                                        ? "/games/lol.png"
                                                        : match.gameCode === "VALORANT"
                                                            ? "/games/valorant.png"
                                                            : "/games/cs2.png"
                                                }
                                                alt={`${match.gameName} logo`}
                                                className="game-logo-image"
                                            />
                                        )}
                                    </div>


                                    <div>
                                        <strong>{match.gameName}</strong>

                                        <div className="matches-game-meta">
                                            <span>{match.nickname}</span>

                                            {(match.category === "COMPETITIVE" ||
                                                match.category === "CASUAL") && (
                                                <span
                                                    className={`matches-category-badge ${
                                                        match.category === "COMPETITIVE"
                                                            ? "competitive"
                                                            : "casual"
                                                    }`}
                                                >
                {match.category}
            </span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                <div>
                  <span
                      className={
                          match.result === "WIN"
                              ? "result win"
                              : match.result === "LOSS"
                                  ? "result loss"
                                  : "result draw"
                      }
                  >
                    {match.result}
                  </span>
                                </div>

                                <div className="match-stat">
                                    <span>KDA</span>
                                    <strong>{match.kda}</strong>
                                </div>

                                <div className="match-stat">
                                    <span>K / D / A</span>
                                    <strong>
                                        {match.kills} / {match.deaths} /{" "}
                                        {match.assists}
                                    </strong>
                                </div>

                                <div className="match-stat">
                                    <span>Score</span>
                                    <strong>
                                        {match.score.toLocaleString()}
                                    </strong>
                                </div>

                                <div className="match-stat">
                                    <span>Played</span>
                                    <strong>
                                        {formatDate(match.playedAt)}
                                    </strong>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}