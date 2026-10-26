"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";
import ClipToast from "@/components/ClipToast";
import Link from "next/link";

interface PlayerProfile {
    id: number;
    userId: number;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    youtubeUrl: string | null;
    twitchUrl: string | null;
    tiktokUrl: string | null;
    instagramUrl: string | null;
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

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [twitchUrl, setTwitchUrl] = useState("");
    const [tiktokUrl, setTiktokUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");
    const [avatarError, setAvatarError] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);
    const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] =
        useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

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

                setYoutubeUrl(data.youtubeUrl ?? "");
                setTwitchUrl(data.twitchUrl ?? "");
                setTiktokUrl(data.tiktokUrl ?? "");
                setInstagramUrl(data.instagramUrl ?? "");
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
                        avatarUrl: avatarUrl || null,
                        youtubeUrl: youtubeUrl.trim() || null,
                        twitchUrl: twitchUrl.trim() || null,
                        tiktokUrl: tiktokUrl.trim() || null,
                        instagramUrl: instagramUrl.trim() || null,
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


    async function handleAvatarChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Only JPG, PNG and WebP images are allowed.");
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            setError("Avatar must be smaller than 3 MB.");
            return;
        }

        setUploadingAvatar(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await authenticatedFetch(
                "http://localhost:8080/api/profile/me/avatar",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not upload avatar."
                );
            }

            const data: PlayerProfile = await response.json();

            setProfile(data);
            setAvatarUrl(data.avatarUrl ?? "");
            setAvatarError(false);

            setSuccess("Avatar updated successfully.");

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
                    : "Could not upload avatar."
            );

        } finally {
            setUploadingAvatar(false);
        }
    }


    async function handleRemoveAvatar() {
        if (!avatarUrl || removingAvatar) {
            return;
        }

        setRemovingAvatar(true);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/profile/me/avatar",
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Could not remove avatar.");
            }

            const data: PlayerProfile = await response.json();

            setProfile(data);
            setAvatarUrl(data.avatarUrl ?? "");
            setAvatarError(false);

            setSuccess("Avatar removed successfully.");

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
                    : "Could not remove avatar."
            );

        }
        finally {
            setRemovingAvatar(false);
            setShowRemoveAvatarConfirm(false);
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

                            {profile?.userId != null && (
                                <Link
                                    href={`/players/${profile.userId}`}
                                    className="profile-public-profile-button"
                                >
                                    View Public Profile
                                    <span aria-hidden="true">↗</span>
                                </Link>
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
                                <label>Bio</label>

                                <textarea
                                    value={bio}
                                    onChange={(event) =>
                                        setBio(event.target.value)
                                    }
                                    placeholder="Tell other players about yourself..."
                                    rows={4}
                                    maxLength={300}
                                />

                                <span className="profile-bio-counter">
                                    {bio.length}/300 characters
                                </span>
                            </div>


                            <div className="profile-social-section">
                                <div className="profile-social-heading">
                                    <h3>Social Links</h3>
                                    <p>
                                        Connect your social accounts and let other
                                        players find you.
                                    </p>
                                </div>

                                <div className="profile-social-grid">
                                    <div className="profile-field">
                                        <label>YouTube</label>
                                        <input
                                            type="url"
                                            value={youtubeUrl}
                                            onChange={(event) =>
                                                setYoutubeUrl(event.target.value)
                                            }
                                            placeholder="https://www.youtube.com/@username"
                                            maxLength={2048}
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label>Twitch</label>
                                        <input
                                            type="url"
                                            value={twitchUrl}
                                            onChange={(event) =>
                                                setTwitchUrl(event.target.value)
                                            }
                                            placeholder="https://www.twitch.tv/username"
                                            maxLength={2048}
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label>TikTok</label>
                                        <input
                                            type="url"
                                            value={tiktokUrl}
                                            onChange={(event) =>
                                                setTiktokUrl(event.target.value)
                                            }
                                            placeholder="https://www.tiktok.com/@username"
                                            maxLength={2048}
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label>Instagram</label>
                                        <input
                                            type="url"
                                            value={instagramUrl}
                                            onChange={(event) =>
                                                setInstagramUrl(event.target.value)
                                            }
                                            placeholder="https://www.instagram.com/username"
                                            maxLength={2048}
                                        />
                                    </div>
                                </div>

                                <p className="profile-social-note">
                                    Only the links you provide will be visible
                                    on your public player profile.
                                </p>
                            </div>



                            <div className="profile-field">
                                <label>Profile picture</label>

                                <div className="profile-avatar-upload">
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleAvatarChange}
                                        aria-label="Select profile picture"
                                        style={{ display: "none" }}
                                    />

                                    <button
                                        type="button"
                                        className="profile-change-avatar-button"
                                        disabled={uploadingAvatar || removingAvatar || saving}
                                        onClick={() => avatarInputRef.current?.click()}
                                    >
                                        {uploadingAvatar
                                            ? "Uploading..."
                                            : "Change Avatar"}
                                    </button>


                                    <button
                                        type="button"
                                        className="profile-remove-avatar-button"
                                        disabled={
                                            !avatarUrl ||
                                            uploadingAvatar ||
                                            removingAvatar ||
                                            saving
                                        }
                                        onClick={() => setShowRemoveAvatarConfirm(true)}
                                    >
                                        {removingAvatar
                                            ? "Removing..."
                                            : "Remove Avatar"}
                                    </button>

                                    <span>
            JPG, PNG or WebP · Max 3 MB
        </span>
                                </div>
                            </div>


                            {error ? (
                                <ClipToast
                                    message={error}
                                    type="error"
                                    onClose={() => setError("")}
                                />
                            ) : success ? (
                                <ClipToast
                                    message={success}
                                    type="success"
                                    onClose={() => setSuccess("")}
                                />
                            ) : null}


                            <div className="profile-actions">
                                <button
                                    type="button"
                                    className="profile-save-button"
                                    disabled={saving || uploadingAvatar || removingAvatar}
                                    onClick={handleSave}
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>

                        </article>


                    </section>
                )}

            </div>

            {showRemoveAvatarConfirm && (
                <div className="clip-delete-modal-overlay">
                    <div
                        className="clip-delete-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="remove-avatar-title"
                        aria-describedby="remove-avatar-description"
                    >
                        <div className="clip-delete-modal-icon">
                            !
                        </div>

                        <h2 id="remove-avatar-title">
                            Remove profile picture?
                        </h2>

                        <p id="remove-avatar-description">
                            Are you sure you want to remove your
                            current profile picture?
                        </p>

                        <p className="clip-delete-warning">
                            Your profile will display your initial
                            instead of your current avatar.
                        </p>

                        <div className="clip-delete-modal-actions">
                            <button
                                type="button"
                                className="clip-delete-cancel"
                                disabled={removingAvatar}
                                onClick={() =>
                                    setShowRemoveAvatarConfirm(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="clip-delete-confirm"
                                disabled={removingAvatar}
                                onClick={() => void handleRemoveAvatar()}
                            >
                                {removingAvatar
                                    ? "Removing..."
                                    : "Remove Avatar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AppShell>
    );
}