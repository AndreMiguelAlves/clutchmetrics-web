
import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";
import SiteFooter from "@/components/SiteFooter";

export default function PrivacyPage() {
    return (
        <>
            <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/dashboard" className={styles.brand}>
                    <Image
                        src="/clutchmetrics-icon.png"
                        alt="ClutchMetrics"
                        width={44}
                        height={44}
                    />

                    <div>
                        <strong>ClutchMetrics</strong>
                        <span>PERFORMANCE HUB</span>
                    </div>
                </Link>

                <Link href="/login" className={styles.loginLink}>
                    Sign in →
                </Link>
            </header>

            <article className={styles.container}>
                <div className={styles.intro}>
                    <span className={styles.eyebrow}>
                        LEGAL INFORMATION
                    </span>

                    <h1>Privacy Policy</h1>

                    <p>
                        Learn how ClutchMetrics handles account
                        information, gaming statistics and
                        community content.
                    </p>

                    <small>Last updated: October 20, 2026</small>
                </div>

                <section className={styles.section}>
                    <h2>1. About This Policy</h2>

                    <p>
                        ClutchMetrics is a platform designed to help players manage their gaming statistics, match history and community interactions. This policy explains how information is processed within the platform.
                    </p>

                    <p>
                        This page describes the main types
                        of information processed by the
                        current project.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. Information We Process</h2>

                    <p>
                        ClutchMetrics processes account
                        information such as usernames,
                        email addresses and securely
                        hashed passwords.
                    </p>

                    <p>
                        The application also stores gaming
                        profiles, match statistics, clip
                        information and community interactions,
                        including likes, comments and reports.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>3. How Information Is Used</h2>

                    <p>
                        Account information is used to support
                        authentication, account verification,
                        password recovery and profile management.
                    </p>

                    <p>
                        Gaming data is used to display
                        performance statistics, match history
                        and challenge progress.
                    </p>

                    <p>
                        Community information supports clip
                        publishing, comments, likes and
                        content moderation.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>4. Authentication and Security</h2>

                    <p>
                        ClutchMetrics uses authentication
                        tokens to manage signed-in sessions
                        and password hashing to protect
                        stored passwords.
                    </p>

                    <p>
                        Administrative activity may also
                        be recorded through audit logs
                        for monitoring and accountability.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>5. Public Community Content</h2>

                    <p>
                        Published clips, usernames and
                        public player profiles may be
                        visible to other users.
                    </p>

                    <p>
                        Users should avoid including
                        personal or sensitive information
                        in publicly shared content.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>6. External Content</h2>

                    <p>
                        Some clips may reference videos
                        hosted on external websites.
                        External platforms operate under
                        their own privacy policies
                        and terms of use.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>7. Data Retention and Changes</h2>

                    <p>
                        lutchMetrics stores information needed to provide account, gaming and community features. Data retention practices and account management options may evolve as the platform develops. This policy may be updated to reflect those changes
                    </p>

                    <p>
                        This policy may be updated as
                        the platform develops.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. Questions and Support</h2>

                    <p>
                        For general questions about
                        ClutchMetrics and its features,
                        visit the Help Center.
                    </p>

                    <Link
                        href="/help#contact"
                        className={styles.inlineLink}
                    >
                        Visit Contact & Support →
                    </Link>
                </section>

                <div className={styles.notice}>
                    For questions about privacy and personal information, please visit our Help Center and Support section.
                </div>
            </article>
            </main>

            <SiteFooter />
        </>
    );
}
