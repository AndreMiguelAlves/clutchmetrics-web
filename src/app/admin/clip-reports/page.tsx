
"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";
import ClipToast from "@/components/ClipToast";

interface ClipReportResponse {
    id: number;
    reportedClipId: number;
    reportedClipTitle: string;
    reporterId: number;
    reporterUsername: string;
    reason: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    details: string | null;
    reviewedByUsername: string | null;
    createdAt: string;
    reviewedAt: string | null;
}

export default function ClipReportsPage() {

    const [reports, setReports] =
        useState<ClipReportResponse[]>([]);


    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "PENDING" | "RESOLVED" | "DISMISSED"
    >("ALL");


    const [reviewPending, setReviewPending] = useState<{
        id: number;
        action: "resolve" | "dismiss";
    } | null>(null);

    const [reviewingId, setReviewingId] = useState<number | null>(null);

    const [reviewNotice, setReviewNotice] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);


    const filteredReports = reports.filter((report) => {
        return statusFilter === "ALL" ||
            report.status === statusFilter;
    });



    const pendingCount = reports.filter(
        (report) => report.status === "PENDING"
    ).length;

    const resolvedCount = reports.filter(
        (report) => report.status === "RESOLVED"
    ).length;

    const dismissedCount = reports.filter(
        (report) => report.status === "DISMISSED"
    ).length;


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accessDenied, setAccessDenied] = useState(false);

    const loadReports = useCallback(async () => {

        setLoading(true);
        setError("");
        setAccessDenied(false);

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/admin/clip-reports"
            );

            if (response.status === 403) {
                setAccessDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "Could not load content reports."
                );
            }

            const data: ClipReportResponse[] =
                await response.json();

            setReports(data);

        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load content reports."
            );

        } finally {
            setLoading(false);
        }

    }, []);


    async function handleReviewReport(
        reportId: number,
        action: "resolve" | "dismiss"
    ): Promise<void> {

        if (reviewingId !== null) return;

        setReviewingId(reportId);
        setReviewNotice(null);

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/admin/clip-reports/${reportId}/${action}`,
                {
                    method: "PUT",
                }
            );

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error(
                        "This action cannot be completed. " +
                        "The clip may have been deleted or " +
                        "the report was already reviewed."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Administrator permissions are required."
                    );
                }

                throw new Error(
                    "Could not review this report."
                );
            }

            const updatedReport: ClipReportResponse =
                await response.json();

            // Atualizar apenas a denúncia alterada
            setReports((current) =>
                current.map((report) =>
                    report.id === updatedReport.id
                        ? updatedReport
                        : report
                )
            );

            setReviewPending(null);

            setReviewNotice({
                type: "success",
                message:
                    action === "resolve"
                        ? "Report resolved. The clip has been removed from the Feed."
                        : "Report dismissed successfully.",
            });

        } catch (error) {
            console.error(error);

            setReviewNotice({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Could not review this report.",
            });

        } finally {
            setReviewingId(null);
        }
    }


    useEffect(() => {
        Promise.resolve().then(() => loadReports());
    }, [loadReports]);

    return (
        <AppShell title="Content Reports">
            <main className="content-reports-page">

                <header className="content-reports-header">
                    <h1>Content Reports</h1>
                    <p>
                        Review and manage reported clips
                        from the ClutchMetrics community.
                    </p>
                </header>


                {!loading && !accessDenied && !error && (
                    <div className="content-reports-stats">

                        <div className="content-reports-stat">
                            <span>Pending</span>
                            <strong className="stat-pending">
                                {pendingCount}
                            </strong>
                            <small>Awaiting review</small>
                        </div>

                        <div className="content-reports-stat">
                            <span>Resolved</span>
                            <strong className="stat-resolved">
                                {resolvedCount}
                            </strong>
                            <small>Action taken</small>
                        </div>

                        <div className="content-reports-stat">
                            <span>Dismissed</span>
                            <strong className="stat-dismissed">
                                {dismissedCount}
                            </strong>
                            <small>No action required</small>
                        </div>

                    </div>
                )}


                {!loading && !accessDenied && !error && (
                    <div className="content-reports-filters">
                        {([
                            ["ALL", "All Reports"],
                            ["PENDING", "Pending"],
                            ["RESOLVED", "Resolved"],
                            ["DISMISSED", "Dismissed"],
                        ] as const).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                className={
                                    statusFilter === value
                                        ? "content-reports-filter active"
                                        : "content-reports-filter"
                                }
                                aria-pressed={statusFilter === value}
                                onClick={() => setStatusFilter(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}



                {loading && (
                    <p>Loading reports...</p>
                )}

                {accessDenied && (
                    <p>
                        Access denied. Administrator
                        permissions are required.
                    </p>
                )}

                {error && (
                    <p role="alert">{error}</p>
                )}

                {!loading && !accessDenied && !error && (
                    <section className="content-reports-list">

                        {filteredReports.length === 0 ? (
                            <p>No reports found.</p>
                        ) : (
                            filteredReports.map((report) => (
                                <article
                                    key={report.id}
                                    className="content-report-card"
                                >

                                    <div className="content-report-card-heading">
                                        <div>
        <span className="content-report-id">
            Report #{report.id}
        </span>

                                            <h2>{report.reportedClipTitle}</h2>
                                        </div>

                                        <span
                                            className={`content-report-status content-report-status-${report.status.toLowerCase()}`}
                                        >
        {report.status}
    </span>
                                    </div>


                                    <p>
                                        Reported by:{" "}
                                        {report.reporterUsername}
                                    </p>

                                    <p>
                                        Reason: {report.reason}
                                    </p>

                                    {report.details && (
                                        <p>
                                            Details: {report.details}
                                        </p>
                                    )}

                                    <p>
                                        Created:{" "}
                                        {new Date(
                                            report.createdAt
                                        ).toLocaleString("en-GB")}
                                    </p>

                                    {report.reviewedByUsername && (
                                        <p>
                                            Reviewed by:{" "}
                                            {report.reviewedByUsername}
                                        </p>
                                    )}


                                    {report.status === "PENDING" && (
                                        <div className="content-report-actions">

                                            <button
                                                type="button"
                                                className="content-report-resolve"
                                                disabled={reviewingId !== null}
                                                onClick={() =>
                                                    setReviewPending({
                                                        id: report.id,
                                                        action: "resolve",
                                                    })
                                                }
                                            >
                                                Resolve
                                            </button>

                                            <button
                                                type="button"
                                                className="content-report-dismiss"
                                                disabled={reviewingId !== null}
                                                onClick={() =>
                                                    setReviewPending({
                                                        id: report.id,
                                                        action: "dismiss",
                                                    })
                                                }
                                            >
                                                Dismiss
                                            </button>

                                        </div>
                                    )}

                                    {reviewPending?.id === report.id && (
                                        <div className="content-report-confirm">

                                            <p>
                                                {reviewPending.action === "resolve"
                                                    ? "Resolve this report and remove the clip from the public Feed?"
                                                    : "Dismiss this report without removing the clip?"}
                                            </p>

                                            <div className="content-report-confirm-buttons">
                                                <button
                                                    type="button"
                                                    className="content-report-dismiss"
                                                    disabled={reviewingId !== null}
                                                    onClick={() => setReviewPending(null)}
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="button"
                                                    className="content-report-resolve"
                                                    disabled={reviewingId !== null}
                                                    onClick={() => {
                                                        if (reviewPending) {
                                                            void handleReviewReport(
                                                                report.id,
                                                                reviewPending.action
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {reviewingId === report.id
                                                        ? "Processing..."
                                                        : "Confirm action"}
                                                </button>
                                            </div>

                                        </div>
                                    )}


                                </article>
                            ))
                        )}

                    </section>
                )}

            </main>


            {reviewNotice && (
                <ClipToast
                    message={reviewNotice.message}
                    type={reviewNotice.type}
                    onClose={() => setReviewNotice(null)}
                />
            )}


        </AppShell>
    );
}
