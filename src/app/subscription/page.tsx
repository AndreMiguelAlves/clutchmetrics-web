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
                                    <li>Standard clip exports</li>
                                    <li>Watermarked exports</li>
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
                                    <li>4K clip exports</li>
                                    <li>No watermark</li>
                                    <li>Premium competitive tools</li>
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
                                        <span>4K export</span>
                                        <strong>
                                            {subscription.export4k
                                                ? "Yes"
                                                : "No"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Watermark</span>
                                        <strong>
                                            {subscription.watermarkEnabled
                                                ? "Enabled"
                                                : "Disabled"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Auto renew</span>
                                        <strong>
                                            {subscription.autoRenew
                                                ? "Enabled"
                                                : "Disabled"}
                                        </strong>
                                    </div>
                                </div>
                            </section>
                        )}

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
                    </>
                )}

            </div>
        </AppShell>
    );
}