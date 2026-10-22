"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";

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

export default function AnalyticsPage() {
    const router = useRouter();

    const [summary, setSummary] =
        useState<DashboardSummary | null>(null);

    const [evolution, setEvolution] =
        useState<DashboardEvolutionPoint[]>([]);

    const [loading, setLoading] = useState(true);
    const [hoveredPointId, setHoveredPointId] =
        useState<number | null>(null);

    const [selectedGame, setSelectedGame] = useState("");

    const [selectedDays, setSelectedDays] =
        useState("30");
    const [selectedResult, setSelectedResult] = useState("ALL");
    const [selectedMinKda, setSelectedMinKda] = useState("ALL")
    const [showAllMatches, setShowAllMatches] = useState(false);




    useEffect(() => {
        if (!selectedGame) {
            return;
        }

        async function loadAnalytics() {

            const daysParam =
                selectedDays === "ALL"
                    ? ""
                    : `&days=${selectedDays}`;
            setLoading(true);
            try {

                const summaryResponse =
                    await authenticatedFetch(
                        `http://localhost:8080/api/dashboard/summary?gameCode=${selectedGame}${daysParam}`
                    );

                const evolutionResponse =
                    await authenticatedFetch(
                        `http://localhost:8080/api/dashboard/evolution?gameCode=${selectedGame}&limit=50${daysParam}`
                    );


                if (
                    !summaryResponse.ok ||
                    !evolutionResponse.ok
                ) {
                    throw new Error(
                        "Não foi possível carregar os dados de analytics."
                    );
                }

                const summaryData: DashboardSummary =
                    await summaryResponse.json();

                const evolutionData: DashboardEvolutionPoint[] =
                    await evolutionResponse.json();

                setSummary(summaryData);
                setEvolution(evolutionData);
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

        loadAnalytics();
    }, [router, selectedGame, selectedDays]);



    const filteredEvolution = evolution.filter((point) => {
        const matchesResult =
            selectedResult === "ALL" ||
            point.result === selectedResult;

        const matchesKda =
            selectedMinKda === "ALL" ||
            point.kda >= Number(selectedMinKda);

        return matchesResult && matchesKda;
    });

    const recentMatches = [...filteredEvolution].reverse();

    const visibleMatches = showAllMatches
        ? recentMatches
        : recentMatches.slice(0, 10);



    const maxChartKda = Math.max(
        1,
        ...filteredEvolution.map((point) => point.kda)
    );

    const chartPoints = filteredEvolution.map((point, index) => {
        const x =
            filteredEvolution.length === 1
                ? 500
                : 50 + (index / (filteredEvolution.length - 1)) * 900;

        const y =
            210 - (point.kda / maxChartKda) * 160;

        return {
            ...point,
            x,
            y,
        };
    });

    const chartLine = chartPoints
        .map((point) => `${point.x},${point.y}`)
        .join(" ");
    const chartDateLabels = chartPoints.reduce<typeof chartPoints>(
        (labels, point, index) => {
            const previousPoint = chartPoints[index - 1];

            const isNewDay =
                !previousPoint ||
                new Date(point.playedAt).toDateString() !==
                new Date(previousPoint.playedAt).toDateString();

            const lastLabel = labels[labels.length - 1];

            if (
                isNewDay &&
                (!lastLabel || point.x - lastLabel.x >= 90)
            ) {
                labels.push(point);
            }

            return labels;
        },
        []
    );


    return (
        <AppShell title="Analytics">
            <div className="analytics-page">

                <header className="analytics-header">
                    <p className="eyebrow">
                        PERFORMANCE ANALYTICS
                    </p>

                    <h1>Analytics</h1>

                    <p>
                        Detailed insights from your competitive matches.
                    </p>
                </header>


                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        gap: "14px",
                        marginBottom: "24px",
                    }}
                >
                    <label
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            color: "#94a3b8",
                            fontSize: "13px",
                        }}
                    >
                        Game
                        <select
                            value={selectedGame}
                            onChange={(event) =>
                                setSelectedGame(event.target.value)
                            }
                            style={{
                                background: "#10151f",
                                color: "#f8fafc",
                                border: "1px solid #293244",
                                borderRadius: "10px",
                                padding: "11px 14px",
                                minWidth: "190px",
                            }}
                        >
                            <option value="" disabled>
                                Select a game
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
                    </label>

                    <label
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            color: "#94a3b8",
                            fontSize: "13px",
                        }}
                    >

                        Period
                        <select
                            value={selectedDays}
                            onChange={(event) => {
                                setSelectedDays(event.target.value);
                            }}
                            style={{
                                background: "#10151f",
                                color: "#f8fafc",
                                border: "1px solid #293244",
                                borderRadius: "10px",
                                padding: "11px 14px",
                                minWidth: "160px",
                            }}
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="ALL">All time</option>
                        </select>
                    </label>
                </div>


                {!selectedGame ? (
                    <div className="matches-empty">
                        Select a game to view your performance analytics.
                    </div>
                ) : loading ? (
                    <div className="matches-empty">
                        Loading analytics...
                    </div>
                ) : (
                    <>
                        <section className="analytics-stats-grid">

                            <article className="analytics-stat-card">
                                <span>AVERAGE KDA</span>
                                <strong>
                                    {summary?.averageKda ?? "—"}
                                </strong>
                            </article>

                            <article className="analytics-stat-card">
                                <span>WIN RATE</span>
                                <strong>
                                    {summary?.winRate ?? "—"}%
                                </strong>
                            </article>

                            <article className="analytics-stat-card">
                                <span>WINS</span>
                                <strong>
                                    {summary?.wins ?? "—"}
                                </strong>
                            </article>

                            <article className="analytics-stat-card">
                                <span>LOSSES</span>
                                <strong>
                                    {summary?.losses ?? "—"}
                                </strong>
                            </article>

                        </section>

                        <section className="analytics-details-grid">

                            <article className="analytics-panel">
                                <p className="eyebrow">
                                    COMBAT PERFORMANCE
                                </p>

                                <h2>Average performance</h2>

                                <div className="analytics-kda-grid">
                                    <div>
                                        <span>Kills</span>
                                        <strong>
                                            {summary?.averageKills ?? "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Deaths</span>
                                        <strong>
                                            {summary?.averageDeaths ?? "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Assists</span>
                                        <strong>
                                            {summary?.averageAssists ?? "—"}
                                        </strong>
                                    </div>
                                </div>
                            </article>

                            <article className="analytics-panel">
                                <p className="eyebrow">
                                    MATCH SUMMARY
                                </p>

                                <h2>Results</h2>

                                <div className="analytics-kda-grid">
                                    <div>
                                        <span>Total</span>
                                        <strong>
                                            {summary?.totalMatches ?? "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Wins</span>
                                        <strong>
                                            {summary?.wins ?? "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Draws</span>
                                        <strong>
                                            {summary?.draws ?? "—"}
                                        </strong>
                                    </div>
                                </div>
                            </article>

                        </section>

                        <section className="analytics-panel analytics-evolution">
                            <p className="eyebrow">
                                KDA EVOLUTION
                            </p>


                            <h2>KDA evolution</h2>


                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "16px",
                                    flexWrap: "wrap",
                                    marginTop: "12px",
                                    marginBottom: "16px",
                                }}
                            >
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        color: "#94a3b8",
                                        fontSize: "13px",
                                    }}
                                >
                                    Result
                                    <select
                                        value={selectedResult}
                                        onChange={(event) =>
                                            setSelectedResult(event.target.value)
                                        }
                                        style={{
                                            background: "#10151f",
                                            color: "#f8fafc",
                                            border: "1px solid #293244",
                                            borderRadius: "10px",
                                            padding: "10px 14px",
                                            minWidth: "150px",
                                        }}
                                    >
                                        <option value="ALL">All results</option>
                                        <option value="WIN">Wins</option>
                                        <option value="LOSS">Losses</option>
                                        <option value="DRAW">Draws</option>
                                    </select>
                                </label>

                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        color: "#94a3b8",
                                        fontSize: "13px",
                                    }}
                                >
                                    KDA
                                    <select
                                        value={selectedMinKda}
                                        onChange={(event) =>
                                            setSelectedMinKda(event.target.value)
                                        }
                                        style={{
                                            background: "#10151f",
                                            color: "#f8fafc",
                                            border: "1px solid #293244",
                                            borderRadius: "10px",
                                            padding: "10px 14px",
                                            minWidth: "150px",
                                        }}
                                    >
                                        <option value="ALL">All KDA</option>
                                        <option value="2">Minimum 2.0</option>
                                        <option value="3">Minimum 3.0</option>
                                        <option value="5">Minimum 5.0</option>
                                    </select>
                                </label>

                            </div>


                            <div
                                style={{
                                    marginTop: "24px",
                                    marginBottom: "32px",
                                    padding: "18px",
                                    background: "#0c111b",
                                    border: "1px solid #222c3d",
                                    borderRadius: "12px",
                                }}
                            >
                                {chartPoints.length > 0 ? (
                                    <svg
                                        viewBox="0 0 1000 280"
                                        style={{
                                            width: "100%",
                                            display: "block",
                                        }}
                                        role="img"
                                        aria-label="KDA evolution across recent matches"
                                    >
                                        <defs>
                                            <linearGradient
                                                id="analyticsKdaGradient"
                                                x1="0%"
                                                y1="0%"
                                                x2="100%"
                                                y2="0%"
                                            >
                                                <stop offset="0%" stopColor="#7955ff" />
                                                <stop offset="100%" stopColor="#15c9ef" />
                                            </linearGradient>
                                        </defs>


                                        {[
                                            { y: 50, value: maxChartKda },
                                            { y: 130, value: maxChartKda / 2 },
                                            { y: 210, value: 0 },
                                        ].map(({ y, value }) => (
                                            <g key={y}>
                                                <line
                                                    x1="50"
                                                    y1={y}
                                                    x2="950"
                                                    y2={y}
                                                    stroke="#253044"
                                                    strokeWidth="1"
                                                />

                                                <text
                                                    x="35"
                                                    y={y + 5}
                                                    textAnchor="end"
                                                    fill="#8295b5"
                                                    fontSize="13"
                                                >
                                                    {value.toFixed(1)}
                                                </text>
                                            </g>
                                        ))}


                                        <polyline
                                            points={chartLine}
                                            fill="none"
                                            stroke="url(#analyticsKdaGradient)"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {chartPoints.map((point) => (
                                            <g key={point.matchId}>
                                                <circle
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r="6"
                                                    fill="#15c9ef"
                                                    stroke="#0c111b"
                                                    strokeWidth="3"
                                                    style={{ cursor: "pointer" }}
                                                    onMouseEnter={() => setHoveredPointId(point.matchId)}
                                                    onMouseLeave={() => setHoveredPointId(null)}
                                                />


                                                {hoveredPointId === point.matchId && (
                                                    <g
                                                        pointerEvents="none"
                                                        transform={`translate(
            ${Math.min(Math.max(point.x, 160), 840)},
            ${point.y <= 125 ? point.y + 15 : point.y - 115}
        )`}
                                                    >
                                                        <rect
                                                            x="-160"
                                                            y="0"
                                                            width="320"
                                                            height="105"
                                                            rx="12"
                                                            fill="#161d30"
                                                            stroke="#6455b8"
                                                            strokeWidth="1.5"
                                                        />

                                                        <text
                                                            x="-144"
                                                            y="25"
                                                            fill="#c4b5fd"
                                                            fontSize="14"
                                                            fontWeight="600"
                                                        >

                                                            {new Date(point.playedAt).toLocaleString("en-GB", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                hour12: false,
                                                            })}

                                                        </text>

                                                        <text
                                                            x="144"
                                                            y="25"
                                                            textAnchor="end"
                                                            fill={point.result === "WIN" ? "#34d399" : "#fb7185"}
                                                            fontSize="13"
                                                            fontWeight="600"
                                                        >
                                                            {point.result}
                                                        </text>

                                                        <text
                                                            x="-144"
                                                            y="57"
                                                            fill="#ffffff"
                                                            fontSize="18"
                                                            fontWeight="700"
                                                        >
                                                            KDA {point.kda.toFixed(2)}
                                                        </text>

                                                        <text
                                                            x="-144"
                                                            y="84"
                                                            fill="#9caec9"
                                                            fontSize="14"
                                                        >
                                                            {`Kills ${point.kills}  ·  Deaths ${point.deaths}  ·  Assists ${point.assists}`}
                                                        </text>
                                                    </g>
                                                )}

                                            </g>
                                        ))}
                                        {chartDateLabels.map((point) => (
                                            <text
                                                key={`date-${point.matchId}`}
                                                x={point.x}
                                                y="252"
                                                textAnchor="middle"
                                                fill="#8295b5"
                                                fontSize="12"
                                            >
                                                {new Date(point.playedAt).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
                                            </text>
                                        ))}
                                    </svg>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 20px",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        <p style={{ fontSize: "15px", marginBottom: "8px" }}>
                                            No matches found
                                        </p>

                                        <p style={{ fontSize: "13px" }}>
                                            {evolution.length > 0
                                                ? "No matches match your selected filters. Try adjusting Result or KDA."
                                                : "No matches available for this game and period."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <h3 style={{ marginBottom: "18px" }}>
                                Recent matches
                            </h3>


                            <div className="analytics-evolution-list">

                                {visibleMatches.length === 0 && (
                                    <p
                                        style={{
                                            color: "#94a3b8",
                                            fontSize: "14px",
                                            textAlign: "center",
                                            padding: "24px 0",
                                        }}
                                    >
                                        No recent matches to display with the selected filters.
                                    </p>
                                )}

                                {visibleMatches.map((point) => (
                                    <div
                                        className="analytics-evolution-row"
                                        key={point.matchId}
                                    >

                                        <span>
                                            {new Date(point.playedAt).toLocaleString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false,
                                            })}
                                        </span>


                                        <span
                                            className={
                                                point.result === "WIN"
                                                    ? "result win"
                                                    : point.result === "LOSS"
                                                        ? "result loss"
                                                        : "result draw"
                                            }
                                        >
                      {point.result}
                    </span>

                                        <div>
                                            <small>KDA</small>
                                            <strong>{point.kda}</strong>
                                        </div>

                                        <div>
                                            <small>K / D / A</small>
                                            <strong>
                                                {point.kills} /{" "}
                                                {point.deaths} /{" "}
                                                {point.assists}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {recentMatches.length > 10 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginTop: "24px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowAllMatches(!showAllMatches)}
                                        style={{
                                            background: "#161d30",
                                            color: "#c4b5fd",
                                            border: "1px solid #3b356b",
                                            borderRadius: "10px",
                                            padding: "12px 24px",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {showAllMatches
                                            ? "Show less"
                                            : `Show more (${recentMatches.length - 10} remaining)`}
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}

            </div>
        </AppShell>
    );
}