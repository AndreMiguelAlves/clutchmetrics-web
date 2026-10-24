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
    category: "COMPETITIVE" | "CASUAL" | "UNKNOWN";
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
}

interface DashboardHistoryMatch extends DashboardEvolutionPoint {
    score: number | null;
}

interface DashboardHistoryResponse {
    matches: DashboardHistoryMatch[];
    totalMatches: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

interface SubscriptionResponse {
    planCode: "FREE" | "PREMIUM";
    unlimitedAnalytics: boolean;
    active: boolean;
}

interface PerformancePeriodStats {
    totalMatches: number;
    averageKda: number;
    winRate: number;
    averageKills: number;
}

interface DashboardPerformanceInsightsResponse {
    currentPeriod: PerformancePeriodStats;
    previousPeriod: PerformancePeriodStats;
    kdaChangePercent: number | null;
    winRateChangePoints: number | null;
    killsChangePercent: number | null;
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
    const [selectedMinKda, setSelectedMinKda] = useState("ALL");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [historyMatches, setHistoryMatches] =
        useState<DashboardHistoryMatch[]>([]);

    const [historyPage, setHistoryPage] =
        useState(0);

    const [historyTotal, setHistoryTotal] =
        useState(0);

    const [historyHasMore, setHistoryHasMore] =
        useState(false);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [historyError, setHistoryError] =
        useState<string | null>(null);


    const [subscription, setSubscription] =
        useState<SubscriptionResponse | null>(null);

    const [subscriptionLoading, setSubscriptionLoading] =
        useState(true);

    const [subscriptionError, setSubscriptionError] =
        useState(false);

    const [showPremiumNotice, setShowPremiumNotice] =
        useState(false);

    const [performanceInsights, setPerformanceInsights] =
        useState<DashboardPerformanceInsightsResponse | null>(null);

    const [insightsLoading, setInsightsLoading] =
        useState(false);

    const [insightsError, setInsightsError] =
        useState<string | null>(null);



    useEffect(() => {
        let cancelled = false;

        async function loadSubscription() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/subscription/me"
                );

                if (!response.ok) {
                    throw new Error("Failed to load subscription.");
                }

                const data: SubscriptionResponse =
                    await response.json();

                if (!cancelled) {
                    setSubscription(data);
                }

            } catch (error) {
                if (cancelled) return;

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

                setSubscriptionError(true);

            } finally {
                if (!cancelled) {
                    setSubscriptionLoading(false);
                }
            }
        }

        void loadSubscription();

        return () => {
            cancelled = true;
        };
    }, [router]);


    useEffect(() => {
        let cancelled = false;

        async function refreshSubscriptionOnFocus() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/subscription/me"
                );

                if (!response.ok) {
                    return;
                }

                const data: SubscriptionResponse =
                    await response.json();

                if (cancelled) {
                    return;
                }

                setSubscription(data);

                const hasPremiumAccess =
                    data.planCode === "PREMIUM" &&
                    data.active &&
                    data.unlimitedAnalytics;

                if (!hasPremiumAccess) {
                    setPerformanceInsights(null);

                    if (selectedDays === "ALL") {
                        setShowPremiumNotice(true);
                        setSelectedDays("30");
                    }
                }

            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to refresh subscription:",
                        error
                    );
                }
            }
        }

        window.addEventListener(
            "focus",
            refreshSubscriptionOnFocus
        );

        return () => {
            cancelled = true;

            window.removeEventListener(
                "focus",
                refreshSubscriptionOnFocus
            );
        };

    }, [selectedDays]);



    useEffect(() => {
        if (
            !selectedGame ||
            subscription?.planCode !== "PREMIUM" ||
            !subscription.active ||
            !subscription.unlimitedAnalytics
        ) {
            return;
        }

        let cancelled = false;

        async function loadPerformanceInsights() {
            setInsightsLoading(true);
            setInsightsError(null);
            setPerformanceInsights(null);

            try {
                const params = new URLSearchParams({
                    gameCode: selectedGame,
                });

                const response = await authenticatedFetch(
                    `http://localhost:8080/api/dashboard/performance-insights?${params.toString()}`
                );

                if (response.status === 403) {
                    if (!cancelled) {
                        setInsightsError(
                            "Premium access is required for Performance Insights."
                        );
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to load Performance Insights.");
                }

                const data: DashboardPerformanceInsightsResponse =
                    await response.json();

                if (!cancelled) {
                    setPerformanceInsights(data);
                }

            } catch (error) {
                if (cancelled) return;

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

                setInsightsError(
                    "Unable to load Performance Insights."
                );

            } finally {
                if (!cancelled) {
                    setInsightsLoading(false);
                }
            }
        }

        void loadPerformanceInsights();

        return () => {
            cancelled = true;
        };

    }, [
        router,
        selectedGame,
        subscription?.planCode,
        subscription?.active,
        subscription?.unlimitedAnalytics
    ]);


    useEffect(() => {
            if (!selectedGame) {
                return;
            }

            let cancelled = false;

            async function loadAnalytics() {
                setLoading(true);

                try {
                    const params = new URLSearchParams({
                        gameCode: selectedGame,
                    });

                    if (selectedDays !== "ALL") {
                        params.set("days", selectedDays);
                    }

                    // Carregar as estatísticas gerais
                    const summaryResponse = await authenticatedFetch(
                        `http://localhost:8080/api/dashboard/summary?${params.toString()}`
                    );


                    if (summaryResponse.status === 403 && selectedDays === "ALL") {
                        if (!cancelled) {
                            setShowPremiumNotice(true);
                            setSelectedDays("30");
                        }
                        return;
                    }

                    if (!summaryResponse.ok) {
                        throw new Error("Failed to load analytics summary.");
                    }


                    const summaryData: DashboardSummary =
                        await summaryResponse.json();

                    // Carregar todas as páginas do histórico
                    const allMatches: DashboardEvolutionPoint[] = [];

                    let page = 0;
                    let hasMore = true;

                    while (hasMore) {
                        const pageParams = new URLSearchParams(params);

                        pageParams.set("page", String(page));
                        pageParams.set("pageSize", "50");

                        const historyResponse = await authenticatedFetch(
                            `http://localhost:8080/api/dashboard/history?${pageParams.toString()}`
                        );

                        if (historyResponse.status === 403 && selectedDays === "ALL") {
                            if (!cancelled) {
                                setShowPremiumNotice(true);
                                setSelectedDays("30");
                            }
                            return;
                        }

                        if (!historyResponse.ok) {
                            throw new Error("Failed to load analytics history.");
                        }

                        const historyData: DashboardHistoryResponse =
                            await historyResponse.json();

                        allMatches.push(...historyData.matches);

                        if (historyData.hasMore && historyData.matches.length === 0) {
                            throw new Error("Invalid history pagination response.");
                        }

                        hasMore = historyData.hasMore;
                        page++;
                    }

                    if (cancelled) {
                        return;
                    }

                    // O backend devolve primeiro as partidas recentes.
                    // O gráfico precisa da ordem cronológica.
                    setSummary(summaryData);
                    setEvolution([...allMatches].reverse());

                } catch (error) {
                    if (cancelled) {
                        return;
                    }

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

                    setSummary(null);
                    setEvolution([]);

                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            }

            void loadAnalytics();

            return () => {
                cancelled = true;
            };

        }, [router, selectedGame, selectedDays]);


    useEffect(() => {
        let cancelled = false;

        if (!selectedGame) {
            return;
        }

        async function loadHistory() {
            setHistoryLoading(true);
            setHistoryError(null);
            setHistoryMatches([]);
            setHistoryPage(0);
            setHistoryTotal(0);
            setHistoryHasMore(false);

            const params = new URLSearchParams({
                gameCode: selectedGame,
                page: "0",
                pageSize: "10",
            });

            if (selectedDays !== "ALL") {
                params.set("days", selectedDays);
            }

            if (selectedResult !== "ALL") {
                params.set("result", selectedResult);
            }

            if (selectedCategory !== "ALL") {
                params.set("category", selectedCategory);
            }

            if (selectedMinKda !== "ALL") {
                params.set("minKda", selectedMinKda);
            }

            try {
                const response = await authenticatedFetch(
                    `http://localhost:8080/api/dashboard/history?${params.toString()}`
                );


                if (response.status === 403 && selectedDays === "ALL") {
                    if (!cancelled) {
                        setShowPremiumNotice(true);
                        setSelectedDays("30");
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to load match history.");
                }


                const data: DashboardHistoryResponse =
                    await response.json();

                if (cancelled) return;

                setHistoryMatches(data.matches);
                setHistoryPage(data.page);
                setHistoryTotal(data.totalMatches);
                setHistoryHasMore(data.hasMore);

            } catch (error) {
                if (cancelled) return;

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

                setHistoryError("Unable to load match history.");

            } finally {
                if (!cancelled) {
                    setHistoryLoading(false);
                }
            }
        }

        void loadHistory();

        return () => {
            cancelled = true;
        };

    }, [
        router,
        selectedGame,
        selectedDays,
        selectedResult,
        selectedCategory,
        selectedMinKda
    ]);


    async function loadMoreMatches() {
        if (!selectedGame || !historyHasMore || historyLoading) {
            return;
        }

        const nextPage = historyPage + 1;

        const params = new URLSearchParams({
            gameCode: selectedGame,
            page: String(nextPage),
            pageSize: "10",
        });

        if (selectedDays !== "ALL") {
            params.set("days", selectedDays);
        }

        if (selectedResult !== "ALL") {
            params.set("result", selectedResult);
        }

        if (selectedCategory !== "ALL") {
            params.set("category", selectedCategory);
        }

        if (selectedMinKda !== "ALL") {
            params.set("minKda", selectedMinKda);
        }

        setHistoryLoading(true);
        setHistoryError(null);

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/dashboard/history?${params.toString()}`
            );

            if (response.status === 403 && selectedDays === "ALL") {
                setShowPremiumNotice(true);
                setSelectedDays("30");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load more matches.");
            }

            const data: DashboardHistoryResponse =
                await response.json();

            setHistoryMatches((previous) => [
                ...previous,
                ...data.matches,
            ]);

            setHistoryPage(data.page);
            setHistoryTotal(data.totalMatches);
            setHistoryHasMore(data.hasMore);

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

            setHistoryError("Unable to load more matches.");

        } finally {
            setHistoryLoading(false);
        }
    }

    function showLessMatches() {
        setHistoryMatches((previous) => previous.slice(0, 10));
        setHistoryPage(0);
        setHistoryHasMore(historyTotal > 10);
        setHistoryError(null);
    }

    const isPremium =
        subscription?.planCode === "PREMIUM" &&
        subscription.active &&
        subscription.unlimitedAnalytics;

    const filteredEvolution = evolution.filter((point) => {
        const matchesResult =
            selectedResult === "ALL" ||
            point.result === selectedResult;

        const matchesCategory =
            selectedCategory === "ALL" ||
            point.category === selectedCategory;

        const matchesKda =
            selectedMinKda === "ALL" ||
            point.kda >= Number(selectedMinKda);

        return matchesResult && matchesCategory && matchesKda;
    });

    const MAX_CHART_POINTS = 50;

    const chartEvolution =
        filteredEvolution.length <= MAX_CHART_POINTS
            ? filteredEvolution
            : Array.from(
                { length: MAX_CHART_POINTS },
                (_, index) => {
                    const position = Math.round(
                        index *
                        (filteredEvolution.length - 1) /
                        (MAX_CHART_POINTS - 1)
                    );

                    return filteredEvolution[position];
                }
            );

    const maxChartKda = Math.max(
        1,
        ...chartEvolution.map((point) => point.kda)
    );

    const chartPoints = chartEvolution.map((point, index) => {
        const x =
            chartEvolution.length === 1
                ? 500
                : 50 + (index / (chartEvolution.length - 1)) * 900;

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
                        Explore your match history, performance trends and competitive progress.
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
                                const nextPeriod = event.target.value;

                                if (nextPeriod === "ALL" && !isPremium) {
                                    setShowPremiumNotice(true);
                                    return;
                                }

                                setShowPremiumNotice(false);
                                setSelectedDays(nextPeriod);
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
                            <option value="ALL">
                                {isPremium ? "All time" : "All time (Premium)"}
                            </option>
                        </select>
                    </label>
                </div>


                {showPremiumNotice && !isPremium && (
                    <div
                        role="alert"
                        style={{
                            background: "linear-gradient(135deg, #19152e, #111722)",
                            border: "1px solid #6455b8",
                            borderRadius: "14px",
                            padding: "24px",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "16px",
                            }}
                        >
                            <div>
                <span
                    style={{
                        color: "#a78bfa",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                    }}
                >
                    PREMIUM FEATURE
                </span>

                                <h3
                                    style={{
                                        color: "#ffffff",
                                        fontSize: "20px",
                                        marginTop: "10px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    {subscriptionLoading
                                        ? "Checking your subscription..."
                                        : subscriptionError
                                            ? "Unable to verify subscription"
                                            : "Unlock unlimited analytics"}
                                </h3>

                                <p
                                    style={{
                                        color: "#94a3b8",
                                        fontSize: "14px",
                                        lineHeight: 1.6,
                                        margin: 0,
                                    }}
                                >
                                    {subscriptionLoading
                                        ? "Please try again once your subscription has loaded."
                                        : subscriptionError
                                            ? "We couldn't verify your plan. Please refresh the page and try again."
                                            : "Upgrade to Premium to explore your complete match history and analyze your performance without time limits."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPremiumNotice(false)}
                                aria-label="Close premium notice"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#94a3b8",
                                    fontSize: "22px",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {!subscriptionLoading && !subscriptionError && (
                            <button
                                type="button"
                                onClick={() => router.push("/subscription")}
                                style={{
                                    background: "#7955ff",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "9px",
                                    padding: "12px 22px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    marginTop: "20px",
                                }}
                            >
                                Upgrade to Premium
                            </button>
                        )}
                    </div>
                )}


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


                        <section
                            className="analytics-panel"
                            style={{ marginBottom: "24px" }}
                        >
                            <p className="eyebrow">PREMIUM ANALYTICS</p>
                            <h2>Performance Insights</h2>

                            <p style={{ color: "#94a3b8", marginTop: "8px" }}>
                                Last 7 days vs. previous 7 days
                            </p>
                            {isPremium && performanceInsights && (
                                <p
                                    style={{
                                        color: "#8295b5",
                                        fontSize: "13px",
                                        marginTop: "8px",
                                    }}
                                >
                                    Matches played: {performanceInsights.currentPeriod.totalMatches}
                                    {" "}vs.{" "}
                                    {performanceInsights.previousPeriod.totalMatches} in the previous period
                                </p>
                            )}

                            {subscriptionLoading ? (
                                <p>Checking your subscription...</p>
                            ) : !isPremium ? (
                                <div style={{ marginTop: "20px" }}>
                                    <p style={{ color: "#94a3b8" }}>
                                        Unlock advanced performance comparisons
                                        with ClutchMetrics Premium.
                                    </p>


                                    <a
                                        href="/subscription"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "#7955ff",
                                            color: "#ffffff",
                                            padding: "12px 20px",
                                            borderRadius: "9px",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            marginTop: "16px",
                                            width: "fit-content",
                                        }}
                                    >
                                        Upgrade to Premium
                                    </a>

                                </div>
                            ) : insightsLoading ? (
                                <p style={{ marginTop: "20px" }}>
                                    Loading Performance Insights...
                                </p>
                            ) : insightsError ? (
                                <p style={{ color: "#fb7185", marginTop: "20px" }}>
                                    {insightsError}
                                </p>
                            ) : performanceInsights ? (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(180px, 1fr))",
                                        gap: "16px",
                                        marginTop: "24px",
                                    }}
                                >
                                    {[
                                        {
                                            label: "Average KDA",
                                            current:
                                            performanceInsights.currentPeriod.averageKda,
                                            previous:
                                            performanceInsights.previousPeriod.averageKda,
                                            change:
                                            performanceInsights.kdaChangePercent,
                                            suffix: "%",
                                        },
                                        {
                                            label: "Win rate",
                                            current:
                                            performanceInsights.currentPeriod.winRate,
                                            previous:
                                            performanceInsights.previousPeriod.winRate,
                                            change:
                                            performanceInsights.winRateChangePoints,
                                            suffix: "pp",
                                        },
                                        {
                                            label: "Average kills",
                                            current:
                                            performanceInsights.currentPeriod.averageKills,
                                            previous:
                                            performanceInsights.previousPeriod.averageKills,
                                            change:
                                            performanceInsights.killsChangePercent,
                                            suffix: "%",
                                        },
                                    ].map((metric) => (
                                        <div
                                            key={metric.label}
                                            style={{
                                                background: "#0c111b",
                                                border: "1px solid #222c3d",
                                                borderRadius: "12px",
                                                padding: "20px",
                                            }}
                                        >
                                            <p style={{ color: "#94a3b8" }}>
                                                {metric.label}
                                            </p>

                                            <h3 style={{
                                                fontSize: "28px",
                                                margin: "14px 0",
                                            }}>
                                                {metric.current}{metric.label === "Win rate" ? "%" : ""}
                                            </h3>

                                            <p style={{
                                                color: "#94a3b8",
                                                fontSize: "13px",
                                            }}>
                                                Previous: {metric.previous}{metric.label === "Win rate" ? "%" : ""}
                                            </p>

                                            <p style={{
                                                color:
                                                    metric.change === null
                                                        ? "#94a3b8"
                                                        : metric.change >= 0
                                                            ? "#34d399"
                                                            : "#fb7185",
                                                marginTop: "10px",
                                                fontWeight: 600,
                                            }}>
                                                {metric.change === null
                                                    ? "Not enough data to compare"
                                                    : `${metric.change > 0 ? "+" : ""}${metric.change}${metric.suffix === "pp" ? " " : ""}${metric.suffix}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ marginTop: "20px", color: "#94a3b8" }}>
                                    No performance insights available.
                                </p>
                            )}
                        </section>


                        <section className="analytics-panel analytics-evolution">
                            <p className="eyebrow">
                                PERFORMANCE TRENDS
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
                                    Category
                                    <select
                                        value={selectedCategory}
                                        onChange={(event) =>
                                            setSelectedCategory(event.target.value)
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
                                        <option value="ALL">All categories</option>
                                        <option value="COMPETITIVE">Competitive</option>
                                        <option value="CASUAL">Casual</option>
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

                                        {chartPoints
                                            .filter((point) => point.matchId === hoveredPointId)
                                            .map((point) => (
                                                <g
                                                    key={`tooltip-${point.matchId}`}
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
                                                        fill={
                                                            point.result === "WIN"
                                                                ? "#34d399"
                                                                : point.result === "LOSS"
                                                                    ? "#fb7185"
                                                                    : "#94a3b8"
                                                        }
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
                                                        {`Kills ${point.kills} · Deaths ${point.deaths} · Assists ${point.assists}`}
                                                    </text>
                                                </g>
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
                                                ? "No matches match your selected filters. Try adjusting Result, Category or KDA."
                                                : "No matches available for this game and period."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <h3 style={{ marginBottom: "18px" }}>
                                Recent matches
                            </h3>


                            <div className="analytics-evolution-list">
                                {historyLoading && (
                                    <p style={{
                                        color: "#94a3b8",
                                        textAlign: "center",
                                        padding: "24px 0"
                                    }}>
                                        Loading matches...
                                    </p>
                                )}

                                {historyError && (
                                    <p style={{
                                        color: "#fb7185",
                                        textAlign: "center",
                                        padding: "24px 0"
                                    }}>
                                        {historyError}
                                    </p>
                                )}

                                {!historyLoading && !historyError && historyMatches.length === 0 && (
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

                                {historyMatches.map((point) => (
                                    <div
                                        className="analytics-evolution-row"
                                        key={point.matchId}
                                    >

                                        <span style={{ fontSize: "14px" }}>
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
                                        <div>
                                            <small>SCORE</small>
                                            <strong>
                                                {point.score != null
                                                    ? point.score.toLocaleString("en-GB")
                                                    : "—"}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(historyHasMore || historyMatches.length > 10) && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "12px",
                                        marginTop: "24px",
                                    }}
                                >
                                    {historyMatches.length > 10 && (
                                        <button
                                            type="button"
                                            onClick={showLessMatches}
                                            disabled={historyLoading}
                                            style={{
                                                background: "#161d30",
                                                color: "#c4b5fd",
                                                border: "1px solid #3b356b",
                                                borderRadius: "10px",
                                                padding: "12px 24px",
                                                cursor: historyLoading ? "wait" : "pointer",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Show less
                                        </button>
                                    )}

                                    {historyHasMore && (
                                        <button
                                            type="button"
                                            onClick={() => void loadMoreMatches()}
                                            disabled={historyLoading}
                                            style={{
                                                background: "#161d30",
                                                color: "#c4b5fd",
                                                border: "1px solid #3b356b",
                                                borderRadius: "10px",
                                                padding: "12px 24px",
                                                cursor: historyLoading ? "wait" : "pointer",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {historyLoading
                                                ? "Loading..."
                                                : `Show more (${historyTotal - historyMatches.length} remaining)`}
                                        </button>
                                    )}
                                </div>
                            )}

                        </section>
                    </>
                )}

            </div>
        </AppShell>
    );
}