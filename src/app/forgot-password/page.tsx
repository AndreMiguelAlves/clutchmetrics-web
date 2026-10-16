"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not process password recovery."
                );
            }

            const message = await response.text();

            setSuccess(
                message ||
                "If an account exists with this email, a password reset link has been sent."
            );

            setEmail("");
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not process password recovery."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo">
                        CM
                    </div>

                    <div>
                        <strong>ClutchMetrics</strong>
                        <span>PERFORMANCE HUB</span>
                    </div>
                </div>

                <div className="auth-heading">
          <span className="page-eyebrow">
            ACCOUNT RECOVERY
          </span>

                    <h1>Forgot password?</h1>

                    <p>
                        Enter your email and we will send
                        you a link to reset your password.
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
                        Email

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                        />
                    </label>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "Send Reset Link"}
                    </button>
                </form>

                <div className="auth-footer">
          <span>
            Remember your password?
          </span>

                    <Link href="/login">
                        Sign in
                    </Link>
                </div>
            </section>
        </main>
    );
}