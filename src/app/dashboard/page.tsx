"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "../../lib/api";
import AppShell from "../../components/AppShell";

interface PlayerProfile {
    id: number;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
}
interface DashboardSummary {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    averageKda: number;
    averageKills: number;
    averageDeaths: number;
    averageAssists: number;
}
interface DashboardEvolutionPoint {
    matchId: number;
    playedAt: string;
    gameCode: string;
    result: string;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
}
interface MatchResponse {
    matchId: number;
    playerGameAccountId: number;
    gameCode: string;
    gameName: string;
    nickname: string;
    externalMatchId: string;
    result: string;
    playedAt: string;
    durationSeconds: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    kda: number;
}
interface GameAccountResponse {
    id: number;
    gameCode: string;
    gameName: string;
    nickname: string;
    externalId: string | null;
    region: string | null;
    platform: string | null;
}
interface SubscriptionResponse {
    id: number;
    planCode: "FREE" | "PREMIUM";
    planName: string;
    monthlyPrice: number;
    unlimitedAnalytics: boolean;
    export4k: boolean;
    watermarkEnabled: boolean;
    startedAt: string | null;
    endsAt: string | null;
    autoRenew: boolean;
    active: boolean;
}

const matches = [
    {
        game: "League of Legends",
        result: "WIN",
        kda: "6.67",
        score: "2,800",
        time: "34 min ago",
    },
    {
        game: "League of Legends",
        result: "LOSS",
        kda: "1.43",
        score: "1,700",
        time: "2h ago",
    },
    {
        game: "League of Legends",
        result: "WIN",
        kda: "5.00",
        score: "3,200",
        time: "4h ago",
    },
];

const games = [
    {
        code: "LOL",
        name: "League of Legends",
        username: "ClutchKing",
        region: "EUW",
    },
    {
        code: "VAL",
        name: "Valorant",
        username: "Not connected",
        region: "—",
    },
    {
        code: "CS2",
        name: "Counter-Strike 2",
        username: "Not connected",
        region: "—",
    },
    {
        code: "RL",
        name: "Rocket League",
        username: "Not connected",
        region: "—",
    },
];

export default function Home() {
    const router = useRouter();

    const [profile, setProfile] =
        useState<PlayerProfile | null>(null);

    const [loadingProfile, setLoadingProfile] =
        useState(true);
    const [summary, setSummary] =
        useState<DashboardSummary | null>(null);
    const [evolution, setEvolution] =
        useState<DashboardEvolutionPoint[]>([]);
    const [latestMatches, setLatestMatches] =
        useState<MatchResponse[]>([]);
    const [gameAccounts, setGameAccounts] =
        useState<GameAccountResponse[]>([]);
    const [subscription, setSubscription] =
        useState<SubscriptionResponse | null>(null);
    const [selectedGame, setSelectedGame] = useState(
        "LEAGUE_OF_LEGENDS"
    );
    const [selectedDays, setSelectedDays] = useState("30");

    useEffect(() => {
        async function loadProfile() {
            const accessToken =
                localStorage.getItem("accessToken");

            if (!accessToken) {
                router.replace("/login");
                return;
            }

            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/profile/me",
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar o perfil."
                    );
                }

                const data: PlayerProfile =
                    await response.json();

                setProfile(data);
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
                setLoadingProfile(false);
            }

        }

        loadProfile();

    }, [router]);

    useEffect(() => {
        async function loadDashboardSummary() {
            const accessToken =
                localStorage.getItem("accessToken");

            if (!accessToken) {
                return;
            }

            const daysParam =
                selectedDays === "ALL"
                    ? ""
                    : `&days=${selectedDays}`;

            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/dashboard/summary?gameCode=${selectedGame}${daysParam}`,
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar o resumo do dashboard."
                    );
                }

                const data: DashboardSummary =
                    await response.json();

                setSummary(data);
            } catch (error) {
                console.error(error);
            }
        }

        loadDashboardSummary();
    }, [selectedGame, selectedDays]);

    useEffect(() => {
        async function loadEvolution() {
            const accessToken =
                localStorage.getItem("accessToken");

            if (!accessToken) {
                return;
            }

            const daysParam =
                selectedDays === "ALL"
                    ? ""
                    : `&days=${selectedDays}`;

            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/dashboard/evolution?gameCode=${selectedGame}&limit=10${daysParam}`,
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar a evolução."
                    );
                }

                const data: DashboardEvolutionPoint[] =
                    await response.json();

                setEvolution(data);
            } catch (error) {
                console.error(error);
            }
        }
        loadEvolution();
    }, [selectedGame, selectedDays]);
    useEffect(() => {
        async function loadLatestMatches() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/matches?gameCode=LEAGUE_OF_LEGENDS",
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar os últimos jogos."
                    );
                }

                const data: MatchResponse[] =
                    await response.json();

                const gameMatches = data.filter(
                    (match) => match.gameCode === selectedGame
                );

                const filteredMatches =
                    selectedDays === "ALL"
                        ? gameMatches
                        : gameMatches.filter((match) => {
                            const matchDate = new Date(match.playedAt);
                            const cutoffDate = new Date();

                            cutoffDate.setDate(
                                cutoffDate.getDate() - Number(selectedDays)
                            );

                            return matchDate >= cutoffDate;
                        });

                setLatestMatches(filteredMatches.slice(0, 3));
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
            }
        }

        loadLatestMatches();
    }, [router, selectedGame, selectedDays]);
    useEffect(() => {
        async function loadGameAccounts() {
            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/matches?gameCode=${selectedGame}`,
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar as contas de jogo."
                    );
                }

                const data: GameAccountResponse[] =
                    await response.json();

                setGameAccounts(data);
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
            }
        }

        loadGameAccounts();
    }, [router]);

    useEffect(() => {
        async function loadSubscription() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/subscription/me"
                );

                if (!response.ok) {
                    return;
                }

                const data: SubscriptionResponse =
                    await response.json();

                setSubscription(data);
            } catch (error) {
                console.error(
                    "Could not load subscription:",
                    error
                );
            }
        }

        loadSubscription();
    }, []);

    function formatMatchTime(playedAt: string) {
        const matchDate = new Date(playedAt);
        const now = new Date();

        const difference =
            now.getTime() - matchDate.getTime();

        const minutes = Math.floor(
            difference / 60000
        );

        if (minutes < 60) {
            return `${Math.max(minutes, 0)} min ago`;
        }

        const hours = Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days = Math.floor(hours / 24);

        return `${days}d ago`;
    }

    const maxChartKda =
        evolution.length > 0
            ? Math.max(
                ...evolution.map((point) => point.kda),
                1
            )
            : 1;

    const chartPoints = evolution
        .map((point, index) => {
            const x =
                evolution.length === 1
                    ? 500
                    : (index / (evolution.length - 1)) * 1000;

            const y =
                220 -
                (point.kda / (maxChartKda * 1.15)) * 180;

            return `${x},${y}`;
        })
        .join(" ");

    const chartAreaPoints =
        evolution.length > 0
            ? `0,220 ${chartPoints} 1000,220`
            : "";

    function formatChartDate(value: string) {
        return new Date(value).toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "2-digit",
            }
        );
    }

    return (
        <AppShell title="Performance Dashboard">

                <div className="dashboard-content">
                    <section className="welcome-row">
                        <div>
                            <p className="eyebrow">YOUR PERFORMANCE</p>
                            <h2>
                                Welcome back,{" "}
                                {loadingProfile
                                    ? "player"
                                    : profile?.displayName ?? "player"}.
                            </h2>
                            <p className="muted">
                                Here&apos;s how you&apos;ve been performing across your
                                latest matches.
                            </p>
                        </div>

                        <div className="filters"><select
                            className="filter-button"
                            value={selectedGame}
                            onChange={(event) =>
                                setSelectedGame(event.target.value)
                            }
                        >
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

                            <select
                                className="filter-button"
                                value={selectedDays}
                                onChange={(event) =>
                                    setSelectedDays(event.target.value)
                                }
                            >
                                <option value="7">
                                    Last 7 days
                                </option>

                                <option value="30">
                                    Last 30 days
                                </option>

                                <option value="ALL">
                                    All time
                                </option>
                            </select>
                        </div>
                    </section>

                    <section className="metrics-grid">
                        <article className="metric-card">
                            <div className="metric-top">
                                <span>KDA RATIO</span>
                                <span className="trend positive">+8.2%</span>
                            </div>

                            <strong className="metric-number">
                                {summary?.averageKda ?? "—"}
                            </strong>
                            <p>Across all matches</p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>WIN RATE</span>

                            </div>

                            <strong className="metric-number">{summary
                                ? `${summary.winRate}%`
                                : "—"}</strong>
                            <p>
                                {summary
                                    ? `${summary.wins} wins · ${summary.losses} losses`
                                    : "Loading..."}
                            </p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>MATCHES</span>
                                <span>
  {selectedDays === "ALL"
      ? "ALL"
      : `${selectedDays}D`}
</span>
                            </div>

                            <strong className="metric-number">{summary?.totalMatches ?? "—"}</strong>
                            <p>Total recorded matches</p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>AVG. KILLS</span>
                            </div>

                            <strong className="metric-number">{summary?.averageKills ?? "—"}</strong>
                            <p>Per match</p>
                        </article>
                    </section>

                    {subscription?.planCode === "FREE" && (
                        <section className="dashboard-premium-banner">
                            <div className="dashboard-premium-content">
                                <div className="dashboard-premium-badge">
                                    PREMIUM
                                </div>

                                <div>
                                    <h2>
                                        Unlock advanced ClutchMetrics analytics
                                    </h2>

                                    <p>
                                        Get unlimited analytics, 4K exports
                                        and remove watermarks from your clips.
                                    </p>
                                </div>
                            </div>

                            <a
                                href="/subscription"
                                className="dashboard-premium-button"
                            >
                                Upgrade to Premium
                            </a>
                        </section>
                    )}

                    <section className="dashboard-grid">
                        <article className="panel performance-panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">ANALYTICS</p>
                                    <h3>KDA evolution</h3>
                                </div>

                                <button className="ghost-button">View analytics</button>
                            </div>

                            <div className="chart-summary">
                                <div>
                                    <strong>
                                        {summary?.averageKda ?? "—"}
                                    </strong>
                                    <span>Average KDA</span>
                                </div>


                            </div>

                            <div className="chart-wrapper">
                                {evolution.length > 0 ? (
                                    <>
                                        <svg
                                            className="performance-chart"
                                            viewBox="0 0 1000 240"
                                            preserveAspectRatio="none"
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="kdaAreaGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#7562ff"
                                                        stopOpacity="0.32"
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#7562ff"
                                                        stopOpacity="0"
                                                    />
                                                </linearGradient>

                                                <linearGradient
                                                    id="kdaLineGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="1"
                                                    y2="0"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#765cff"
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#20d4ff"
                                                    />
                                                </linearGradient>
                                            </defs>

                                            <line
                                                x1="0"
                                                y1="40"
                                                x2="1000"
                                                y2="40"
                                                className="chart-grid-line"
                                            />

                                            <line
                                                x1="0"
                                                y1="100"
                                                x2="1000"
                                                y2="100"
                                                className="chart-grid-line"
                                            />

                                            <line
                                                x1="0"
                                                y1="160"
                                                x2="1000"
                                                y2="160"
                                                className="chart-grid-line"
                                            />

                                            <line
                                                x1="0"
                                                y1="220"
                                                x2="1000"
                                                y2="220"
                                                className="chart-grid-line"
                                            />

                                            <polygon
                                                points={chartAreaPoints}
                                                fill="url(#kdaAreaGradient)"
                                            />

                                            <polyline
                                                points={chartPoints}
                                                fill="none"
                                                stroke="url(#kdaLineGradient)"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
                                            />

                                            {evolution.map((point, index) => {
                                                const x =
                                                    evolution.length === 1
                                                        ? 500
                                                        : (index / (evolution.length - 1)) * 1000;

                                                const y =
                                                    220 -
                                                    (point.kda / (maxChartKda * 1.15)) * 180;

                                                return (
                                                    <circle
                                                        key={point.matchId}
                                                        cx={x}
                                                        cy={y}
                                                        r="5"
                                                        className="chart-point"
                                                    />
                                                );
                                            })}
                                        </svg>

                                        <div className="chart-dates">
                                            {evolution.map((point) => (
                                                <span key={point.matchId}>
          {formatChartDate(point.playedAt)}
        </span>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="chart-empty">
                                        No match data available.
                                    </div>
                                )}
                                </div>

                        </article>

                        <article className="panel challenge-panel">
                            <div className="challenge-accent" />

                            <div className="challenge-brand">
                                <span>SPONSORED CHALLENGE</span>
                                <strong>LOGITECH G</strong>
                            </div>

                            <div>
                                <span className="game-tag">LEAGUE OF LEGENDS</span>
                                <h3>Victory Protocol</h3>
                                <p>Win 5 ranked matches before the challenge expires.</p>
                            </div>

                            <div className="challenge-progress">
                                <div className="progress-label">
                                    <span>Progress</span>
                                    <strong>4 / 5 wins</strong>
                                </div>

                                <div className="progress-track">
                                    <div className="progress-value" />
                                </div>
                            </div>

                            <div className="reward-box">
                                <span>REWARD</span>
                                <strong>Logitech G Pro X Headset</strong>
                            </div>

                            <div className="challenge-footer">
                                <span>2 days left</span>
                                <button>View challenge</button>
                            </div>
                        </article>
                    </section>

                    <section className="bottom-grid">
                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">RECENT ACTIVITY</p>
                                    <h3>Latest matches</h3>
                                </div>

                                <button
                                    className="ghost-button"
                                    onClick={() => router.push("/matches")}
                                >
                                    View all
                                </button>
                            </div>
                            <div className="matches-list">
                                {latestMatches.length === 0 ? (
                                    <div className="latest-matches-empty">
                                        <p>No recent matches for the selected filters.</p>
                                    </div>
                                ) : (
                                    latestMatches.map((match) => (
                                    <div
                                        className="match-row"
                                        key={match.matchId}
                                    >
                                        <div className="match-game">
                                            <div className="game-icon game-badge-image">
                                                <img
                                                    src={
                                                        match.gameCode === "LEAGUE_OF_LEGENDS"
                                                            ? "/games/lol.png"
                                                            : match.gameCode === "VALORANT"
                                                                ? "/games/valorant.png"
                                                                : match.gameCode === "CS2"
                                                                    ? "/games/cs2.png"
                                                                    : "/games/rocket-league.png"
                                                    }
                                                    alt={`${match.gameName} logo`}
                                                    className="game-logo-image"
                                                />
                                            </div>

                                            <div>
                                                <strong>{match.gameName}</strong>
                                                <span>
            {formatMatchTime(match.playedAt)}
          </span>
                                            </div>
                                        </div>

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

                                        <div className="match-stat">
                                            <span>KDA</span>
                                            <strong>{match.kda}</strong>
                                        </div>

                                        <div className="match-stat">
                                            <span>Score</span>
                                            <strong>{match.score}</strong>
                                        </div>
                                    </div>
                                    ))
                                )}
                            </div>
                        </article>

                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">ACCOUNTS</p>
                                    <h3>Your games</h3>
                                </div>

                                <button
                                    className="ghost-button"
                                    onClick={() => router.push("/game-accounts")}
                                >
                                    Manage
                                </button>
                            </div>

                            <div className="games-grid">
                                {games.map((game) => {
                                    const apiGameCode =
                                        game.code === "LOL"
                                            ? "LEAGUE_OF_LEGENDS"
                                            : game.code === "VAL"
                                                ? "VALORANT"
                                                : game.code === "CS2"
                                                    ? "CS2"
                                                    : "ROCKET_LEAGUE";

                                    const account = gameAccounts.find(
                                        (item) => item.gameCode === apiGameCode
                                    );

                                    const gameImage =
                                        game.code === "LOL"
                                            ? "/games/lol.png"
                                            : game.code === "VAL"
                                                ? "/games/valorant.png"
                                                : game.code === "CS2"
                                                    ? "/games/cs2.png"
                                                    : "/games/rocket-league.png";

                                    return (
                                        <div
                                            className="game-card"
                                            key={game.code}
                                        >
                                            <div
                                                className={`game-badge game-badge-image game-logo-${game.code.toLowerCase()}`}
                                            >
                                                <img
                                                    src={gameImage}
                                                    alt={`${game.name} logo`}
                                                    className="game-logo-image"
                                                />
                                            </div>

                                            <div>
                                                <strong>{game.name}</strong>

                                                <span
                                                    className={
                                                        account
                                                            ? "account-status connected"
                                                            : "account-status disconnected"
                                                    }
                                                >
          {account?.nickname ?? "Not connected"}
        </span>
                                            </div>

                                            <span className="region">
        {account?.region ?? "—"}
      </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    </section>
                </div>
        </AppShell>
    );
}
