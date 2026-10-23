"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { authenticatedFetch } from "../../lib/api";

interface SubscriptionResponse {
    id: number;
    planCode: "FREE" | "PREMIUM";
    planName: string;
    monthlyPrice: number;
    unlimitedAnalytics: boolean;
    export4k: boolean;
    watermarkEnabled: boolean;
    startedAt: string | null;
    endsAt: string | null;
    autoRenew: boolean;
    active: boolean;
}

export default function SubscriptionPage() {
    const router = useRouter();

    const [subscription, setSubscription] =
        useState<SubscriptionResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [changingPlan, setChangingPlan] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentTime, setCurrentTime] = useState<number | null>(null);

    useEffect(() => {
        async function loadSubscription() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/subscription/me"
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar a subscrição."
                    );
                }

                const data: SubscriptionResponse =
                    await response.json();

                setSubscription(data);
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

                setError("Could not load your subscription.");
            } finally {
                setLoading(false);
            }
        }

        loadSubscription();
    }, [router]);


    useEffect(() => {
        if (!subscription || (!success && !error)) {
            return;
        }

        const timer = setTimeout(() => {
            setSuccess("");
            setError("");
        }, 4500);

        return () => clearTimeout(timer);
    }, [success, error, subscription]);


    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(Date.now());
        };

        const initialTimer = window.setTimeout(updateTime, 0);

        const interval = window.setInterval(
            updateTime,
            60 * 1000
        );

        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(interval);
        };
    }, []);


    async function changePlan(
        planCode: "FREE" | "PREMIUM"
    ) {
        if (subscription?.planCode === planCode) {
            return;
        }

        setChangingPlan(true);
        setError("");
        setSuccess("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/subscription/change-plan",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        planCode,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not change subscription plan."
                );
            }

            const data: SubscriptionResponse =
                await response.json();

            setSubscription(data);

            setSuccess(
                `Plan changed to ${data.planName}.`
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
                    : "Could not change subscription plan."
            );
        } finally {
            setChangingPlan(false);
        }
    }


    const premiumEndsAt =
        subscription?.planCode === "PREMIUM" &&
        subscription.active &&
        subscription.endsAt
            ? new Date(subscription.endsAt)
            : null;



    const today =
        currentTime !== null
            ? new Date(currentTime)
            : null;

    const premiumDaysRemaining =
        premiumEndsAt &&
        today &&
        !Number.isNaN(premiumEndsAt.getTime())
            ? Math.max(
                0,
                Math.round(
                    (
                        Date.UTC(
                            premiumEndsAt.getFullYear(),
                            premiumEndsAt.getMonth(),
                            premiumEndsAt.getDate()
                        ) -
                        Date.UTC(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                        )
                    ) / (1000 * 60 * 60 * 24)
                )
            )
            : null;

    ;


    return (
        <AppShell title="Subscription">
            <div className="subscription-page">

                <header className="subscription-header">
                    <p className="eyebrow">
                        MEMBERSHIP
                    </p>

                    <h1>Subscription</h1>

                    <p>
                        Choose the plan that fits your competitive goals.
                    </p>
                </header>

                {loading ? (
                    <div className="matches-empty">
                        Loading subscription...
                    </div>
                ) : error && !subscription ? (
                    <div className="matches-empty">
                        {error}
                    </div>
                ) : (
                    <>
                        <section className="subscription-current">
                            <div>
                                <span>CURRENT PLAN</span>

                                <strong>
                                    {subscription?.planName ??
                                        subscription?.planCode}
                                </strong>

                                {premiumDaysRemaining !== null && premiumEndsAt && (
                                    <p
                                        style={{
                                            marginTop: "10px",
                                            color: "#c4b5fd",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {premiumDaysRemaining > 0
                                            ? `${premiumDaysRemaining} days remaining in current period`
                                            : "Current period has ended"}
                                        {" · "}
                                        {premiumEndsAt.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                )}

                            </div>

                            <span
                                className={
                                    subscription?.active
                                        ? "subscription-active"
                                        : "subscription-inactive"
                                }
                            >
                {subscription?.active
                    ? "ACTIVE"
                    : "INACTIVE"}
              </span>
                        </section>

                        <section className="plans-grid">

                            <article
                                className={`plan-option ${
                                    subscription?.planCode === "FREE"
                                        ? "current"
                                        : ""
                                }`}
                            >
                                <p className="eyebrow">
                                    FREE
                                </p>

                                <h2>Free</h2>

                                <div className="plan-price">
                                    <strong>€0</strong>
                                    <span>/ month</span>
                                </div>

                                <p className="plan-description">
                                    Essential performance tracking
                                    for competitive players.
                                </p>

                                <ul>
                                    <li>Core match analytics</li>
                                    <li>Game account tracking</li>
                                    <li>Match history</li>
                                    <li>HD video exports (720p)</li>
                                </ul>

                                <button
                                    type="button"
                                    disabled={
                                        changingPlan ||
                                        subscription?.planCode === "FREE"
                                    }
                                    onClick={() =>
                                        changePlan("FREE")
                                    }
                                >
                                    {subscription?.planCode === "FREE"
                                        ? "Current plan"
                                        : "Switch to Free"}
                                </button>
                            </article>

                            <article
                                className={`plan-option premium ${
                                    subscription?.planCode === "PREMIUM"
                                        ? "current"
                                        : ""
                                }`}
                            >
                                <div className="premium-plan-top">
                                    <p className="eyebrow">
                                        PREMIUM
                                    </p>

                                    <span>RECOMMENDED</span>
                                </div>

                                <h2>Premium</h2>

                                <div className="plan-price">
                                    <strong>€9.99</strong>
                                    <span>/ month</span>
                                </div>

                                <p className="plan-description">
                                    Advanced analytics and creator
                                    features without limits.
                                </p>

                                <ul>
                                    <li>Unlimited analytics</li>
                                    <li>Advanced performance insights</li>
                                    <li>Full HD video exports (1080p)</li>
                                </ul>

                                <button
                                    type="button"
                                    disabled={
                                        changingPlan ||
                                        subscription?.planCode ===
                                        "PREMIUM"
                                    }
                                    onClick={() =>
                                        changePlan("PREMIUM")
                                    }
                                >
                                    {changingPlan
                                        ? "Updating..."
                                        : subscription?.planCode ===
                                        "PREMIUM"
                                            ? "Current plan"
                                            : "Upgrade to Premium"}
                                </button>
                            </article>

                        </section>

                        {subscription && (
                            <section className="subscription-details">
                                <h2>Plan details</h2>


                                <div className="subscription-details-grid">
                                    <div>
                                        <span>Unlimited analytics</span>
                                        <strong>
                                            {subscription.unlimitedAnalytics
                                                ? "Yes"
                                                : "No"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Video export quality</span>
                                        <strong>
                                            {subscription.planCode === "PREMIUM" &&
                                            subscription.active
                                                ? "Full HD (1080p)"
                                                : "HD (720p)"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Performance Insights</span>
                                        <strong>
                                            {subscription.planCode === "PREMIUM" &&
                                            subscription.active
                                                ? "Unlocked"
                                                : "Locked"}
                                        </strong>
                                    </div>
                                </div>

                            </section>
                        )}


                        {(success || error) && (
                            <div
                                role={error ? "alert" : "status"}
                                style={{
                                    position: "fixed",
                                    top: "90px",
                                    right: "20px",
                                    zIndex: 1000,
                                    width: "min(380px, calc(100vw - 40px))",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                    padding: "18px",
                                    background: "#161d30",
                                    border: `1px solid ${
                                        error ? "#fb7185" : "#6455b8"
                                    }`,
                                    borderRadius: "14px",
                                    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.35)",
                                }}
                            >
                                <div
                                    style={{
                                        width: "38px",
                                        height: "38px",
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "10px",
                                        background: error ? "#3b1d2a" : "#173b32",
                                        color: error ? "#fb7185" : "#34d399",
                                        fontSize: "20px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {error ? "!" : "✓"}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <strong
                                        style={{
                                            display: "block",
                                            color: "#ffffff",
                                            fontSize: "15px",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        {error
                                            ? "Something went wrong"
                                            : subscription?.planCode === "PREMIUM"
                                                ? "Welcome to Premium!"
                                                : "Switched to Free"}
                                    </strong>

                                    <p
                                        style={{
                                            color: "#94a3b8",
                                            fontSize: "13px",
                                            lineHeight: "1.5",
                                            margin: 0,
                                        }}
                                    >
                                        {error
                                            ? error
                                            : subscription?.planCode === "PREMIUM"
                                                ? "Unlimited analytics is now available."
                                                : "Your Free plan is now active."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Close notification"
                                    onClick={() => {
                                        setSuccess("");
                                        setError("");
                                    }}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        fontSize: "20px",
                                        padding: 0,
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                    </>
                )}

            </div>
        </AppShell>
    );
}