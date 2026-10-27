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
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";

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
                    "Unable to sign in. Please check your credentials."
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
                "Unable to connect to the server. Please try again later."
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
                        <Image
                            src="/clutchmetrics-icon.png"
                            alt="ClutchMetrics"
                            width={46}
                            height={46}
                            className={styles.brandLogo}
                        />
                    </div>


                    <div>
                        <strong>ClutchMetrics</strong>
                        <span>Gaming Hub</span>
                    </div>
                </header>

                <div className={styles.heroContent}>
                  <span className={styles.heroEyebrow}>
                    ANALYTICS • VIDEO CREATION • COMMUNITY
                    </span>

                    <h1>
                        Your game.
                        <br />
                        Your data.
                        <br />
                        <span>Your edge.</span>
                    </h1>


                    <p>
                        Track your performance, create and edit gaming
                        clips, and share your best moments with a community
                        built for players. All in one platform.
                    </p>




                    <div className={styles.heroStats}>
                        <div>
                            <span>ANALYTICS</span>
                            <strong>KDA</strong>
                            <small>Track your performance</small>
                        </div>

                        <div>
                            <span>CREATOR STUDIO</span>
                            <strong>Clips</strong>
                            <small>Edit & share highlights</small>
                        </div>

                        <div>
                            <span>COMMUNITY</span>
                            <strong>Feed</strong>
                            <small>Discover & follow players</small>
                        </div>
                    </div>


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
                            Pick up where you left off. Track your stats,
                            create highlights and connect with fellow players.
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

                    <Link
                        href="/about#features"
                        className={styles.exploreFeaturesLink}
                    >
                        Explore Features
                        <ArrowRight size={16} />
                    </Link>

                    <p className={styles.terms}>
                        By continuing, you agree to the ClutchMetrics{" "}
                        <Link href="/terms">
                            Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy">
                            Privacy Policy
                        </Link>.
                    </p>

                </div>
            </section>
        </main>
    );
}



export default function LoginPage() {
    return (
        <>
            <Suspense fallback={null}>
                <LoginContent />
            </Suspense>

            <SiteFooter />
        </>
    );
}
