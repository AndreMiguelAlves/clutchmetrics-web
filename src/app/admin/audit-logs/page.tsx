"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";

interface AuditLogResponse {
    id: number;
    userId: number;
    username: string;
    email: string;
    action: string;
    entityType: string;
    entityId: number;
    description: string;
    createdAt: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] =
        useState<AuditLogResponse[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [accessDenied, setAccessDenied] =
        useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        setLoading(true);
        setError("");

        try {
            const response =
                await authenticatedFetch(
                    "http://localhost:8080/api/admin/audit-logs"
                );

            if (response.status === 403) {
                setAccessDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "Could not load audit logs."
                );
            }

            const data: AuditLogResponse[] =
                await response.json();

            setLogs(data);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load audit logs."
            );
        } finally {
            setLoading(false);
        }
    }

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
        <AppShell title="Audit Logs">
            <div className="audit-page">
                <div className="audit-header">
          <span className="page-eyebrow">
            ADMINISTRATION
          </span>

                    <h1>Audit logs</h1>

                    <p>
                        Review administrative actions
                        performed across ClutchMetrics.
                    </p>
                </div>

                {error && (
                    <div className="page-error">
                        {error}
                    </div>
                )}

                {accessDenied ? (
                    <div className="admin-access-denied">
                        <h2>Access denied</h2>

                        <p>
                            Your account does not have
                            administrator permissions.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="admin-loading">
                        Loading audit logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="admin-loading">
                        No audit logs found.
                    </div>
                ) : (
                    <div className="audit-card">
                        <div className="audit-summary">
                            <span>Total audit events</span>
                            <strong>{logs.length}</strong>
                        </div>

                        <div className="audit-table-wrapper">
                            <table className="audit-table">
                                <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>Description</th>
                                </tr>
                                </thead>

                                <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            {formatDate(
                                                log.createdAt
                                            )}
                                        </td>

                                        <td>
                                            <div className="audit-user">
                                                <strong>
                                                    {log.username}
                                                </strong>

                                                <span>
                            {log.email}
                          </span>
                                            </div>
                                        </td>

                                        <td>
                        <span className="audit-action">
                          {log.action}
                        </span>
                                        </td>

                                        <td>
                                            <div className="audit-entity">
                                                <strong>
                                                    {log.entityType}
                                                </strong>

                                                <span>
                            ID #{log.entityId}
                          </span>
                                            </div>
                                        </td>

                                        <td>
                                            {log.description}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}