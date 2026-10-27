
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ConfirmPasswordChangePage() {
    const [token, setToken] = useState("");
    const [ready, setReady] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        setToken(params.get("token") ?? "");
        setReady(true);
    }, []);

    async function handleConfirm() {
        if (!token) {
            setError("Invalid password change confirmation link.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/confirm-password-change",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not confirm the password change. The link may be invalid or expired."
                );
            }

            const message = await response.text();

            setSuccess(
                message ||
                "Password changed successfully. Please sign in again."
            );

            setToken("");

            window.history.replaceState(
                null,
                "",
                "/confirm-password-change"
            );

        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not confirm the password change."
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
                        ACCOUNT SECURITY
                    </span>

                    <h1>Confirm password change</h1>

                    <p>
                        Confirm your request to update your
                        ClutchMetrics account password.
                    </p>
                </div>

                {ready && !token && !success && (
                    <div className="auth-error">
                        Invalid password change confirmation link.
                    </div>
                )}

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

                {ready && token && !success && (
                    <div className="auth-form">
                        <button
                            type="button"
                            className="auth-submit"
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading
                                ? "Confirming..."
                                : "Confirm Password Change"}
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <span>Back to login?</span>

                    <Link href="/login">
                        Sign in
                    </Link>
                </div>

            </section>
        </main>
    );
}
