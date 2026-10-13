"use client";

import {
    LayoutDashboard,
        ChartNoAxesCombined,
        Swords,
        Gamepad2,
        Clapperboard,
        Radio,
        Trophy,
        CreditCard,
        UserRound,
        Search,
        Bell,
        ChevronDown,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "../../lib/api";

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

            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/dashboard/summary?gameCode=LEAGUE_OF_LEGENDS",
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
    }, []);

    useEffect(() => {
        async function loadEvolution() {
            const accessToken =
                localStorage.getItem("accessToken");

            if (!accessToken) {
                return;
            }

            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/dashboard/evolution?gameCode=LEAGUE_OF_LEGENDS&limit=10",
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
    }, []);

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
        <main className="app-shell">
            <aside className="sidebar">
                <div>
                    <div className="brand">
                        <div className="brand-mark">
                            <span className="logo-c">C</span>
                            <span className="logo-m">M</span>
                        </div>

                        <div>
                            <strong>ClutchMetrics</strong>
                            <span>Performance Hub</span>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <p className="nav-label">Workspace</p>

                        <a className="nav-item active" href="#">
                            <LayoutDashboard size={17} strokeWidth={1.8} />
                            <span>Overview</span>
                        </a>

                        <a className="nav-item" href="#">
                            <ChartNoAxesCombined size={17} strokeWidth={1.8} />
                            <span>Analytics</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Swords size={17} strokeWidth={1.8} />
                            <span>Matches</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Gamepad2 size={17} strokeWidth={1.8} />
                            <span>Game Accounts</span>
                        </a>

                        <p className="nav-label nav-label-spaced">Community</p>

                        <a className="nav-item" href="#">
                            <Clapperboard size={17} strokeWidth={1.8} />
                            <span>Clips</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Radio size={17} strokeWidth={1.8} />
                            <span>Feed</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Trophy size={17} strokeWidth={1.8} />
                            <span>Challenges</span>
                        </a>

                        <p className="nav-label nav-label-spaced">Account</p>

                        <a className="nav-item" href="#">
                            <CreditCard size={17} strokeWidth={1.8} />
                            <span>Subscription</span>
                        </a>

                        <a className="nav-item" href="#">
                            <UserRound size={17} strokeWidth={1.8} />
                            <span>Profile</span>
                        </a>
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="plan-card">
                        <span className="plan-pill">FREE PLAN</span>
                        <strong>Unlock more analytics</strong>
                        <p>Upgrade for unlimited insights and exports.</p>
                        <button>View Premium</button>
                    </div>

                    <div className="sidebar-user">
                        <div className="avatar">C</div>

                        <div>
                            <strong>
                                {profile?.displayName ?? "player"}
                            </strong>
                            <span>Player</span>
                        </div>

                        <span className="user-more">•••</span>
                    </div>
                </div>
            </aside>

            <section className="main-content">
                <header className="topbar">
                    <div>
                        <span className="topbar-eyebrow">OVERVIEW</span>
                        <h1>Performance Dashboard</h1>
                    </div>

                    <div className="topbar-actions">
                        <button className="topbar-tool">
                            <Search size={17} strokeWidth={1.8} />
                            <span>Search</span>
                        </button>

                        <button className="notification-button" aria-label="Notifications">
                            <Bell size={17} strokeWidth={1.8} />
                            <span className="notification-dot" />
                        </button>

                        <div className="profile-chip">
                            <div className="avatar small-avatar">C</div>

                            <div className="profile-info">
                                <strong>
                                    {profile?.displayName ?? "player"}
                                </strong>
                                <span>EUW</span>
                            </div>

                            <ChevronDown
                                className="profile-chevron"
                                size={15}
                                strokeWidth={1.8}
                            />
                        </div>
                    </div>
                </header>

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

                        <div className="filters">
                            <button className="filter-button">
                                League of Legends
                                <span>⌄</span>
                            </button>

                            <button className="filter-button">
                                Last 30 days
                                <span>⌄</span>
                            </button>
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
                                <span className="neutral-badge">30D</span>
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

                                <button className="ghost-button">View all</button>
                            </div>

                            <div className="matches-list">
                                {matches.map((match, index) => (
                                    <div className="match-row" key={index}>
                                        <div className="match-game">
                                            <div className="game-icon">L</div>

                                            <div>
                                                <strong>{match.game}</strong>
                                                <span>{match.time}</span>
                                            </div>
                                        </div>

                                        <span
                                            className={
                                                match.result === "WIN"
                                                    ? "result win"
                                                    : "result loss"
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
                                ))}
                            </div>
                        </article>

                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">ACCOUNTS</p>
                                    <h3>Your games</h3>
                                </div>

                                <button className="ghost-button">Manage</button>
                            </div>

                            <div className="games-grid">
                                {games.map((game) => (
                                    <div className="game-card" key={game.code}>
                                        <div className={`game-badge badge-${game.code.toLowerCase()}`}>
                                            {game.code}
                                        </div>

                                        <div>
                                            <strong>{game.name}</strong>
                                            <span
                                                className={
                                                    game.username === "Not connected"
                                                        ? "account-status disconnected"
                                                        : "account-status connected"
                                                }
                                            >
  {game.username}
</span>
                                        </div>

                                        <span className="region">{game.region}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>
                </div>
            </section>

            <button className="chat-button" aria-label="Open Clutch Assistant">
                CM
                <span className="chat-status" />
            </button>
        </main>
    );
}
