"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";

interface PlayerProfile {
    id: number;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
}

export default function ProfilePage() {
    const router = useRouter();

    const [profile, setProfile] =
        useState<PlayerProfile | null>(null);

    const [displayName, setDisplayName] =
        useState("");

    const [bio, setBio] =
        useState("");

    const [avatarUrl, setAvatarUrl] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/profile/me"
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar o perfil."
                    );
                }

                const data: PlayerProfile =
                    await response.json();

                setProfile(data);

                setDisplayName(
                    data.displayName ?? ""
                );

                setBio(
                    data.bio ?? ""
                );

                setAvatarUrl(
                    data.avatarUrl ?? ""
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

                setError(
                    "Could not load your profile."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    async function handleSave() {
        if (!displayName.trim()) {
            setError(
                "Display name is required."
            );
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/profile/me",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        displayName,
                        bio: bio || null,
                        avatarUrl:
                            avatarUrl || null,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not update profile."
                );
            }

            const data: PlayerProfile =
                await response.json();

            setProfile(data);

            setSuccess(
                "Profile updated successfully."
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

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update profile."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppShell title="Profile">
            <div className="profile-page">

                <header className="profile-header">
                    <p className="eyebrow">
                        ACCOUNT
                    </p>

                    <h1>Profile</h1>

                    <p>
                        Manage your public
                        ClutchMetrics identity.
                    </p>
                </header>

                {loading ? (
                    <div className="matches-empty">
                        Loading profile...
                    </div>
                ) : (
                    <section className="profile-grid">

                        <article className="profile-preview-card">
                            <div className="profile-avatar-large">
                                {avatarUrl && !avatarError ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile avatar"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <span>
                    {displayName
                        .charAt(0)
                        .toUpperCase() || "P"}
                  </span>
                                )}
                            </div>

                            <strong>
                                {displayName || "Player"}
                            </strong>

                            <span>
                ClutchMetrics Player
              </span>

                            {bio && (
                                <p>{bio}</p>
                            )}
                        </article>

                        <article className="profile-form-card">

                            <div className="profile-field">
                                <label>
                                    Display name
                                </label>

                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(event) =>
                                        setDisplayName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Your display name"
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Bio
                                </label>

                                <textarea
                                    value={bio}
                                    onChange={(event) =>
                                        setBio(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Tell other players something about yourself..."
                                    rows={5}
                                />
                            </div>

                            <div className="profile-field">
                                <label>
                                    Avatar URL
                                </label>

                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(event) => {
                                        setAvatarUrl(event.target.value);
                                        setAvatarError(false);
                                    }}
                                    placeholder="https://..."
                                />
                            </div>

                            {error && (
                                <p className="profile-error">
                                    {error}
                                </p>
                            )}

                            {success && (
                                <p className="profile-success">
                                    {success}
                                </p>
                            )}

                            <div className="profile-actions">
                                <button
                                    type="button"
                                    className="profile-save-button"
                                    disabled={saving}
                                    onClick={handleSave}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save changes"}
                                </button>
                            </div>

                        </article>

                    </section>
                )}

            </div>
        </AppShell>
    );
}