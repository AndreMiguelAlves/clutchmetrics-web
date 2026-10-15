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

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const summaryResponse =
                    await authenticatedFetch(
                        "http://localhost:8080/api/dashboard/summary?gameCode=LEAGUE_OF_LEGENDS"
                    );

                const evolutionResponse =
                    await authenticatedFetch(
                        "http://localhost:8080/api/dashboard/evolution?gameCode=LEAGUE_OF_LEGENDS&limit=10"
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
    }, [router]);

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

                {loading ? (
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

                            <h2>Recent matches</h2>

                            <div className="analytics-evolution-list">
                                {evolution.map((point) => (
                                    <div
                                        className="analytics-evolution-row"
                                        key={point.matchId}
                                    >
                    <span>
                      {new Date(
                          point.playedAt
                      ).toLocaleDateString("en-GB")}
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
                        </section>
                    </>
                )}

            </div>
        </AppShell>
    );
}