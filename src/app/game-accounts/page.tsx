"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {authenticatedFetch} from "../../lib/api";
import AppShell from "../../components/AppShell";

interface GameAccountResponse {
    id: number;
    gameCode: string;
    gameName: string;
    nickname: string;
    externalId: string | null;
    region: string | null;
    platform: string | null;
    connected: boolean;
}

const supportedGames = [
    {
        code: "LEAGUE_OF_LEGENDS",
        shortCode: "LOL",
        name: "League of Legends",
    },
    {
        code: "VALORANT",
        shortCode: "VAL",
        name: "Valorant",
    },
    {
        code: "CS2",
        shortCode: "CS2",
        name: "Counter-Strike 2",
    },
];

const regionOptions: Record<string, string[]> = {
    LEAGUE_OF_LEGENDS: [
        "EUW", "EUNE", "NA", "KR", "BR",
        "LAN", "LAS", "JP", "OCE", "TR"
    ],
    VALORANT: [
        "EU", "NA", "AP", "KR", "BR", "LATAM"
    ],
    CS2: [
        "EU", "NA", "SA", "ASIA", "OCE"
    ],
};

const platformOptions: Record<string, string[]> = {
    LEAGUE_OF_LEGENDS: ["PC"],
    VALORANT: ["PC", "PS5", "XBOX"],
    CS2: ["PC"],
};

export default function GameAccountsPage() {
    const router = useRouter();

    const [accounts, setAccounts] =
        useState<GameAccountResponse[]>([]);

    const [loading, setLoading] =
        useState(true);
    const [connectingGame, setConnectingGame] =
        useState<string | null>(null);
    const [editingAccountId, setEditingAccountId] =
        useState<number | null>(null);

    const [nickname, setNickname] = useState("");
    const [externalId, setExternalId] = useState("");
    const [region, setRegion] = useState("");
    const [platform, setPlatform] = useState("");

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [disconnectAccountId, setDisconnectAccountId] =
        useState<number | null>(null);

    const [updatingConnection, setUpdatingConnection] =
        useState(false);

    const [connectionError, setConnectionError] =
        useState("");

    useEffect(() => {
        async function loadAccounts() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/game-accounts",
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Could not load game accounts."
                    );
                }

                const data: GameAccountResponse[] =
                    await response.json();

                setAccounts(data);
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

        loadAccounts();
    }, [router]);

    function openConnectForm(gameCode: string) {
        setConnectingGame(gameCode);
        setEditingAccountId(null);

        setNickname("");
        setExternalId("");
        setRegion("");
        setPlatform("PC");
        setFormError("");

    }

    function openEditForm(account: GameAccountResponse) {
        setConnectingGame(account.gameCode);
        setEditingAccountId(account.id);

        setNickname(account.nickname);
        setExternalId(account.externalId ?? "");
        setRegion(account.region ?? "");
        setPlatform(account.platform ?? "PC");

        setFormError("");
    }

    async function handleConnect(gameCode: string) {
        if (!nickname.trim()) {
            setFormError("Nickname is required.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const isEditing = editingAccountId !== null;

            const url = isEditing
                ? `http://localhost:8080/api/game-accounts/${editingAccountId}`
                : "http://localhost:8080/api/game-accounts";

            const response = await authenticatedFetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...(!isEditing ? { gameCode } : {}),
                    nickname: nickname.trim(),
                    externalId: externalId.trim() || null,
                    region: gameCode === "CS2" ? null : (region || null),
                    platform: platform || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not connect the account."
                );
            }

            const savedAccount: GameAccountResponse =
                await response.json();

            setAccounts((current) =>
                isEditing
                    ? current.map((account) =>
                        account.id === savedAccount.id
                            ? savedAccount
                            : account
                    )
                    : [...current, savedAccount]
            );

            setConnectingGame(null);
            setEditingAccountId(null);

            setNickname("");
            setExternalId("");
            setRegion("");
            setPlatform("");
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

            setFormError(
                error instanceof Error
                    ? error.message
                    : "Could not connect the account."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDisconnect() {
        if (disconnectAccountId === null || updatingConnection) {
            return;
        }

        setUpdatingConnection(true);
        setConnectionError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/game-accounts/${disconnectAccountId}/disconnect`,
                {
                    method: "PUT",
                }
            );

            if (!response.ok) {
                throw new Error("Could not disconnect the account.");
            }

            const updatedAccount: GameAccountResponse =
                await response.json();

            setAccounts((current) =>
                current.map((account) =>
                    account.id === updatedAccount.id
                        ? updatedAccount
                        : account
                )
            );

            setDisconnectAccountId(null);

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

            setConnectionError(
                error instanceof Error
                    ? error.message
                    : "Could not disconnect the account."
            );

        } finally {
            setUpdatingConnection(false);
        }
    }

    async function handleReconnect(accountId: number) {
        if (updatingConnection) {
            return;
        }

        setUpdatingConnection(true);
        setConnectionError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/game-accounts/${accountId}/reconnect`,
                {
                    method: "PUT",
                }
            );

            if (!response.ok) {
                throw new Error("Could not reconnect the account.");
            }

            const updatedAccount: GameAccountResponse =
                await response.json();

            setAccounts((current) =>
                current.map((account) =>
                    account.id === updatedAccount.id
                        ? updatedAccount
                        : account
                )
            );

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

            setConnectionError(
                error instanceof Error
                    ? error.message
                    : "Could not reconnect the account."
            );

        } finally {
            setUpdatingConnection(false);
        }
    }

    return (
        <AppShell title="Game Accounts">
            <div className="accounts-page-container">

                <header className="accounts-page-header">
                    <p className="eyebrow">
                        GAME ACCOUNTS
                    </p>

                    <h1>Your games</h1>

                    <p>
                        Connect and manage your competitive game accounts.
                    </p>
                </header>

                {connectionError && (
                    <p className="connect-form-error">
                        {connectionError}
                    </p>
                )}

                {loading ? (
                    <div className="matches-empty">
                        Loading accounts...
                    </div>
                ) : (
                    <div className="accounts-page-grid">
                        {supportedGames.map((game) => {
                            const account = accounts.find(
                                (item) =>
                                    item.gameCode === game.code
                            );

                            const gameImage =
                                game.code === "LEAGUE_OF_LEGENDS"
                                    ? "/games/lol.png"
                                    : game.code === "VALORANT"
                                        ? "/games/valorant.png"
                                        : "/games/cs2.png";

                            return (
                                <article
                                    className="account-page-card"
                                    key={game.code}
                                >
                                    <div className="account-page-game">
                                        <div
                                            className={`game-icon game-badge-image game-logo-${game.shortCode.toLowerCase()}`}
                                        >
                                            <img
                                                src={gameImage}
                                                alt={`${game.name} logo`}
                                                className="game-logo-image"
                                            />
                                        </div>

                                        <div>
                                            <strong>{game.name}</strong>

                                            <span>
                        {account && account.connected !== false
                            ? account.nickname
                            : "Not connected"}
                      </span>
                                        </div>
                                    </div>
                                    {account && account.connected === false ? (
                                        <div className="account-connect-area">
        <span className="account-not-connected">
            Match history preserved
        </span>

                                            <button
                                                type="button"
                                                className="connect-account-button"
                                                disabled={updatingConnection}
                                                onClick={() => handleReconnect(account.id)}
                                            >
                                                {updatingConnection
                                                    ? "Reconnecting..."
                                                    : "Reconnect account"}
                                            </button>
                                        </div>
                                    ) : account && editingAccountId !== account.id ? (
                                        <>

                                            <div className="account-page-details">
                                                {game.code !== "CS2" && (
                                                    <div>
                                                        <span>Region</span>
                                                        <strong>{account.region ?? "—"}</strong>
                                                    </div>
                                                )}

                                                <div>
                                                    <span>Platform</span>
                                                    <strong>{account.platform ?? "—"}</strong>
                                                </div>
                                            </div>


                                            <div className="connect-form-actions">
                                                <button
                                                    type="button"
                                                    className="account-disconnect-button"
                                                    disabled={updatingConnection}
                                                    onClick={() => {
                                                        setConnectionError("");
                                                        setDisconnectAccountId(account.id);
                                                    }}
                                                >
                                                    Disconnect
                                                </button>

                                                <button
                                                    type="button"
                                                    className="connect-account-button"
                                                    onClick={() => openEditForm(account)}
                                                >
                                                    Edit account
                                                </button>
                                            </div>
                                        </>
                                    ) : connectingGame === game.code ? (
                                        <div className="connect-account-form">
                                            <div className="connect-form-grid">
                                                <input
                                                    type="text"
                                                    placeholder="Nickname"
                                                    value={nickname}
                                                    onChange={(event) =>
                                                        setNickname(event.target.value)
                                                    }
                                                />

                                                <input
                                                    type="text"
                                                    placeholder={game.code === "CS2" ? "Steam ID" : "External ID"}
                                                    value={externalId}
                                                    onChange={(event) =>
                                                        setExternalId(event.target.value)
                                                    }
                                                />


                                                {game.code !== "CS2" && (
                                                    <select
                                                        value={region}
                                                        onChange={(event) => setRegion(event.target.value)}
                                                        aria-label="Region"
                                                    >
                                                        <option value="" disabled>
                                                            Select region
                                                        </option>

                                                        {regionOptions[game.code].map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}


                                                <select
                                                    value={platform}
                                                    onChange={(event) => setPlatform(event.target.value)}
                                                    aria-label="Platform"
                                                >
                                                    <option value="" disabled>
                                                        Select platform
                                                    </option>

                                                    {platformOptions[game.code].map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {formError && (
                                                <p className="connect-form-error">
                                                    {formError}
                                                </p>
                                            )}

                                            <div className="connect-form-actions">
                                                <button
                                                    type="button"
                                                    className="connect-cancel-button"
                                                    onClick={() => {
                                                        setConnectingGame(null);
                                                        setEditingAccountId(null);
                                                        setFormError("");
                                                    }}
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="button"
                                                    className="connect-account-button"
                                                    disabled={saving}
                                                    onClick={() => handleConnect(game.code)}
                                                >
                                                    {saving
                                                        ? "Saving..."
                                                        : editingAccountId !== null
                                                            ? "Save changes"
                                                            : "Save account"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="account-connect-area">
    <span className="account-not-connected">
      No account connected
    </span>

                                            <button
                                                className="connect-account-button"
                                                onClick={() => openConnectForm(game.code)}
                                            >
                                                Connect account
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
            {disconnectAccountId !== null && (
                <div className="account-disconnect-overlay">
                    <div
                        className="account-disconnect-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="account-disconnect-title"
                    >
                        <div className="account-disconnect-icon">
                            !
                        </div>

                        <h2 id="account-disconnect-title">
                            Disconnect game account?
                        </h2>

                        <p>
                            Are you sure you want to disconnect{" "}
                            <strong>
                                {accounts.find(
                                    (account) =>
                                        account.id === disconnectAccountId
                                )?.gameName}
                            </strong>
                            ?
                        </p>

                        <p className="account-disconnect-info">
                            Your match history and statistics will be preserved.
                            You can reconnect this account at any time.
                        </p>

                        {connectionError && (
                            <p className="connect-form-error">
                                {connectionError}
                            </p>
                        )}

                        <div className="account-disconnect-actions">
                            <button
                                type="button"
                                className="account-disconnect-cancel"
                                disabled={updatingConnection}
                                onClick={() => {
                                    setDisconnectAccountId(null);
                                    setConnectionError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="account-disconnect-confirm"
                                disabled={updatingConnection}
                                onClick={handleDisconnect}
                            >
                                {updatingConnection
                                    ? "Disconnecting..."
                                    : "Confirm disconnect"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}