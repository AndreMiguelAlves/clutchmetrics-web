"use client";

import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./login.module.css";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailVerified = searchParams.get("verified") === "success";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Não foi possível iniciar sessão."
                );

                setPassword("");

                return;
            }

            localStorage.setItem(
                "accessToken",
                data.accessToken
            );

            if (data.refreshToken) {
                localStorage.setItem(
                    "refreshToken",
                    data.refreshToken
                );
            }

            router.push("/dashboard");
        } catch {
            setError(
                "Não foi possível comunicar com o servidor."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className={styles.loginPage}>
            <section className={styles.visualSide}>
                <div className={styles.visualGlowOne} />
                <div className={styles.visualGlowTwo} />

                <header className={styles.brand}>
                    <div className={styles.brandMark}>
                        <span>C</span>
                        <span>M</span>
                    </div>

                    <div>
                        <strong>ClutchMetrics</strong>
                        <span>Performance Hub</span>
                    </div>
                </header>

                <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            ESPORTS PERFORMANCE PLATFORM
          </span>

                    <h1>
                        Your game.
                        <br />
                        Your data.
                        <br />
                        <span>Your edge.</span>
                    </h1>

                    <p>
                        Turn every match into insight. Track your
                        performance, understand your playstyle and improve
                        with data that matters.
                    </p>

                    <div className={styles.heroStats}>
                        <div>
                            <span>KDA</span>
                            <strong>4.26</strong>
                            <small>Performance tracking</small>
                        </div>

                        <div>
                            <span>WIN RATE</span>
                            <strong>61.2%</strong>
                            <small>Competitive insights</small>
                        </div>

                        <div>
                            <span>GAMES</span>
                            <strong>4</strong>
                            <small>One platform</small>
                        </div>
                    </div>
                </div>

                <div className={styles.visualFooter}>
                    <ShieldCheck size={17} />

                    <span>
            Secure authentication powered by ClutchMetrics
          </span>
                </div>
            </section>

            <section className={styles.formSide}>
                <div className={styles.formWrapper}>
                    <div className={styles.mobileBrand}>
                        <div className={styles.brandMark}>
                            <span>C</span>
                            <span>M</span>
                        </div>

                        <strong>ClutchMetrics</strong>
                    </div>

                    <div className={styles.formHeading}>
                        <span>WELCOME BACK</span>

                        <h2>Sign in to ClutchMetrics</h2>

                        <p>
                            Continue where you left off and check your latest
                            performance.
                        </p>
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={handleSubmit}
                    >


                        {emailVerified && (
                            <div className={styles.verifiedNotice} role="status">
                                <ShieldCheck size={21} />

                                <div>
                                    <strong>Email verified successfully!</strong>
                                    <p>
                                        Your account has been activated.
                                        You can now sign in to ClutchMetrics.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className={styles.field}>
                            <label htmlFor="email">
                                Email
                            </label>

                            <div className={styles.inputWrapper}>
                                <Mail size={18} />

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="player@example.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.passwordLabel}>
                                <label htmlFor="password">
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className={styles.forgotPassword}
                                    onClick={() => router.push("/forgot-password")}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <div className={styles.inputWrapper}>
                                <LockKeyhole size={18} />

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    required
                                />

                                <button
                                    className={styles.passwordToggle}
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    aria-label="Show password"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <button
                            className={styles.loginButton}
                            type="submit"
                            disabled={loading}
                        >
              <span>
                {loading
                    ? "Signing in..."
                    : "Sign in"}
              </span>

                            {!loading && (
                                <ArrowRight
                                    size={18}
                                    strokeWidth={2}
                                />
                            )}
                        </button>
                    </form>
                    <div className={styles.separator}>
                        <span />
                        <p>NEW TO CLUTCHMETRICS?</p>
                        <span />
                    </div>

                    <button
                        className={styles.registerButton}
                        type="button"
                        onClick={() =>
                            router.push("/register")
                        }
                    >
                        Create an account
                    </button>

                    <p className={styles.terms}>
                        By continuing, you agree to the ClutchMetrics Terms
                        of Service and Privacy Policy.
                    </p>
                </div>
            </section>
        </main>
    );
}


export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
