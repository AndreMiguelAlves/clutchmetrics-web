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
    {
        code: "ROCKET_LEAGUE",
        shortCode: "RL",
        name: "Rocket League",
    },
];

export default function GameAccountsPage() {
    const router = useRouter();

    const [accounts, setAccounts] =
        useState<GameAccountResponse[]>([]);

    const [loading, setLoading] =
        useState(true);
    const [connectingGame, setConnectingGame] =
        useState<string | null>(null);

    const [nickname, setNickname] = useState("");
    const [externalId, setExternalId] = useState("");
    const [region, setRegion] = useState("");
    const [platform, setPlatform] = useState("");

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

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
                        "Não foi possível carregar as contas."
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

        setNickname("");
        setExternalId("");
        setRegion("");
        setPlatform("");
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
            const response = await authenticatedFetch(
                "http://localhost:8080/api/game-accounts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gameCode,
                        nickname,
                        externalId: externalId || null,
                        region: region || null,
                        platform: platform || null,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not connect the account."
                );
            }

            const newAccount: GameAccountResponse =
                await response.json();

            setAccounts((current) => [
                ...current,
                newAccount,
            ]);

            setConnectingGame(null);
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

                            return (
                                <article
                                    className="account-page-card"
                                    key={game.code}
                                >
                                    <div className="account-page-game">
                                        <div className="game-icon">
                                            {game.shortCode}
                                        </div>

                                        <div>
                                            <strong>{game.name}</strong>

                                            <span>
                        {account
                            ? account.nickname
                            : "Not connected"}
                      </span>
                                        </div>
                                    </div>
                                    {account ? (
                                        <div className="account-page-details">
                                            <div>
                                                <span>Region</span>
                                                <strong>
                                                    {account.region ?? "—"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Platform</span>
                                                <strong>
                                                    {account.platform ?? "—"}
                                                </strong>
                                            </div>
                                        </div>
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
                                                    placeholder="External ID"
                                                    value={externalId}
                                                    onChange={(event) =>
                                                        setExternalId(event.target.value)
                                                    }
                                                />

                                                <input
                                                    type="text"
                                                    placeholder="Region (EUW, EU, NA...)"
                                                    value={region}
                                                    onChange={(event) =>
                                                        setRegion(event.target.value)
                                                    }
                                                />

                                                <input
                                                    type="text"
                                                    placeholder="Platform (PC...)"
                                                    value={platform}
                                                    onChange={(event) =>
                                                        setPlatform(event.target.value)
                                                    }
                                                />
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
                                                    onClick={() => setConnectingGame(null)}
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="button"
                                                    className="connect-account-button"
                                                    disabled={saving}
                                                    onClick={() => handleConnect(game.code)}
                                                >
                                                    {saving ? "Connecting..." : "Save account"}
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
        </AppShell>
    );
}