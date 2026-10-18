"use client";

import { useCallback, useEffect, useState } from "react";
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

    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [entityFilter, setEntityFilter] = useState("ALL");

    const loadLogs = useCallback(async () => {

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
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => loadLogs());
    }, [loadLogs]);

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

    const filteredLogs = logs.filter((log) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            log.username.toLowerCase().includes(search) ||
            log.email.toLowerCase().includes(search) ||
            log.description.toLowerCase().includes(search);

        const matchesAction =
            actionFilter === "ALL" ||
            log.action === actionFilter;

        const matchesEntity =
            entityFilter === "ALL" ||
            log.entityType === entityFilter;

        return (
            matchesSearch &&
            matchesAction &&
            matchesEntity
        );
    });

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
                        <div className="audit-log-filters">
                            <input
                                type="text"
                                placeholder="Search user, email or description..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                            />

                            <select
                                value={actionFilter}
                                onChange={(event) =>
                                    setActionFilter(event.target.value)
                                }
                            >
                                <option value="ALL">All actions</option>
                                <option value="USER_ROLES_CHANGED">User roles changed</option>
                                <option value="USER_STATUS_CHANGED">User status changed</option>
                                <option value="PASSWORD_CHANGED">Password changed</option>
                                <option value="SUBSCRIPTION_CHANGED">Subscription changed</option>
                                <option value="CLIP_PUBLISHED">Clip published</option>
                                <option value="CHALLENGE_JOINED">Challenge joined</option>
                            </select>

                            <select
                                value={entityFilter}
                                onChange={(event) =>
                                    setEntityFilter(event.target.value)
                                }
                            >
                                <option value="ALL">All entities</option>
                                <option value="User">User</option>
                                <option value="Subscription">Subscription</option>
                                <option value="Clip">Clip</option>
                                <option value="Challenge">Challenge</option>
                            </select>
                        </div>
                        <div className="audit-summary">
                            <span>Audit events</span>
                            <strong>
                                {filteredLogs.length} of {logs.length}
                            </strong>
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
                                {filteredLogs.map((log) => (
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