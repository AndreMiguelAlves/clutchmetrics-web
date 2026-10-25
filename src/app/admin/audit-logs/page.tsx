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


function translateAuditDescription(description: string): string {
    const text = description.trim();

    const statusMatch = text.match(
        /^Estado do utilizador (.+?) alterado para enabled=(true|false)$/
    );

    if (statusMatch) {
        return `Account ${statusMatch[1]} ${
            statusMatch[2] === "true" ? "enabled" : "disabled"
        }.`;
    }

    const translations: Array<[RegExp, string]> = [


        [
            /^Subscrição Premium expirada\. Alterada automaticamente para FREE\.?$/,
            "Premium subscription expired. Automatically changed to FREE."
        ],


        [
            /^Roles do utilizador (.+?) alterados para (.+)$/,
            "User roles for $1 changed to $2."
        ],
        [
            /^Partida criada com resultado: (.+)$/,
            "Match created with result: $1."
        ],
        [
            /^Subscrição alterada de (.+?) para (.+)$/,
            "Subscription changed from $1 to $2."
        ],
        [
            /^Utilizador publicou o clip: (.+)$/,
            "User published clip: $1."
        ],
        [
            /^Utilizador entrou no challenge: (.+)$/,
            "User joined challenge: $1."
        ],
        [
            /^Utilizador completou o challenge: (.+)$/,
            "User completed challenge: $1."
        ],
        [
            /^Utilizador alterou a password\.?$/,
            "User changed their password."
        ]
    ];

    for (const [pattern, replacement] of translations) {
        if (pattern.test(text)) {
            return text.replace(pattern, replacement);
        }
    }

    return text;
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
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

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


    const availableActions = Array.from(
        new Set(logs.map((log) => log.action))
    ).sort();

    const availableEntities = Array.from(
        new Set(
            logs.map((log) =>
                log.entityType.toUpperCase() === "CLIP"
                    ? "Clip"
                    : log.entityType
            )
        )
    ).sort();


    const filteredLogs = logs.filter((log) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            log.username.toLowerCase().includes(search) ||
            log.email.toLowerCase().includes(search) ||
            translateAuditDescription(log.description)
                .toLowerCase()
                .includes(search);

        const matchesAction =
            actionFilter === "ALL" ||
            log.action === actionFilter;

        const matchesEntity =
            entityFilter === "ALL" ||
            log.entityType.toLowerCase() === entityFilter.toLowerCase();

        return (
            matchesSearch &&
            matchesAction &&
            matchesEntity
        );
    });


    const totalPages = Math.max(
        1,
        Math.ceil(filteredLogs.length / PAGE_SIZE)
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedLogs = filteredLogs.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE
    );


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
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                            />

                            <select
                                value={actionFilter}
                                onChange={(event) => {
                                    setActionFilter(event.target.value);
                                    setCurrentPage(1);
                                }}
                            >

                                <option value="ALL">All actions</option>

                                {availableActions.map((action) => {
                                    const label = action
                                        .toLowerCase()
                                        .replaceAll("_", " ");

                                    return (
                                        <option key={action} value={action}>
                                            {label.charAt(0).toUpperCase() + label.slice(1)}
                                        </option>
                                    );
                                })}

                            </select>

                            <select
                                value={entityFilter}
                                onChange={(event) => {
                                    setEntityFilter(event.target.value);
                                    setCurrentPage(1);
                                }}
                            >

                                <option value="ALL">All entities</option>

                                {availableEntities.map((entity) => (
                                    <option key={entity} value={entity}>
                                        {entity}
                                    </option>
                                ))}

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
                                {paginatedLogs.map((log) => (
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
                                            {translateAuditDescription(log.description)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="audit-pagination">
    <span>
        Showing{" "}
        {filteredLogs.length === 0
            ? 0
            : (safeCurrentPage - 1) * PAGE_SIZE + 1}
        –{Math.min(
        safeCurrentPage * PAGE_SIZE,
        filteredLogs.length
    )}{" "}
        of {filteredLogs.length}
    </span>

                            <div className="audit-pagination-controls">
                                <button
                                    type="button"
                                    disabled={safeCurrentPage === 1}
                                    onClick={() =>
                                        setCurrentPage(safeCurrentPage - 1)
                                    }
                                >
                                    Previous
                                </button>

                                <span>
            Page {safeCurrentPage} of {totalPages}
        </span>

                                <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() =>
                                        setCurrentPage(safeCurrentPage + 1)
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </AppShell>
    );
}