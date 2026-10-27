"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
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
                    "Could not reset password."
                );
            }

            const message = await response.text();

            setSuccess(
                message ||
                "Password changed successfully."
            );

            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not reset password."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">

                    <Image
                        src="/clutchmetrics-icon.png"
                        alt="ClutchMetrics"
                        width={44}
                        height={44}
                        className="auth-logo-image"
                    />


                    <div>
                        <strong>ClutchMetrics</strong>
                        <span>GAMING HUB</span>
                    </div>
                </div>

                <div className="auth-heading">
          <span className="page-eyebrow">
            PASSWORD RESET
          </span>

                    <h1>Set a new password</h1>

                    <p>
                        Choose a new password for your
                        ClutchMetrics account.
                    </p>
                </div>

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
                        Confirm password

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
                            placeholder="Repeat your password"
                        />
                    </label>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading || !token}
                    >
                        {loading
                            ? "Updating..."
                            : "Update Password"}
                    </button>
                </form>

                <div className="auth-footer">
          <span>
            Back to login?
          </span>

                    <Link href="/login">
                        Sign in
                    </Link>
                </div>
            </section>
        </main>
    );
}