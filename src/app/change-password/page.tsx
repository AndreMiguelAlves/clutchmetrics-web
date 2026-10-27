
"use client";

import { FormEvent, useState } from "react";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setError(
                "The new password must be different from the current password."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/auth/change-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not request a password change."
                );
            }

            const message = await response.text();

            setSuccess(
                message ||
                "A confirmation link has been sent to your email. " +
                "Your password will only change after confirmation."
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not request a password change."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <AppShell title="Change Password">
            <div className="change-password-page">

                <div className="change-password-header">
                    <span className="page-eyebrow">
                        ACCOUNT SECURITY
                    </span>

                    <h1>Change password</h1>

                    <p>
                        Request a password change for your
                        ClutchMetrics account. You will need
                        to confirm the change through your
                        registered email address.
                    </p>
                </div>

                <div className="change-password-card">

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="auth-success">
                            {success}
                        </div>
                    )}

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        <label>
                            Current password

                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(
                                        event.target.value
                                    )
                                }
                                required
                                autoComplete="current-password"
                                placeholder="Enter your current password"
                            />
                        </label>

                        <label>
                            New password

                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                minLength={8}
                                maxLength={72}
                                required
                                autoComplete="new-password"
                                placeholder="Minimum 8 characters"
                            />
                        </label>

                        <label>
                            Confirm new password

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                minLength={8}
                                maxLength={72}
                                required
                                autoComplete="new-password"
                                placeholder="Repeat your new password"
                            />
                        </label>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Sending..."
                                : "Send Confirmation Email"}
                        </button>

                    </form>
                </div>
            </div>
        </AppShell>
    );
}
