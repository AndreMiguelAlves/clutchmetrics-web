
import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";
import SiteFooter from "@/components/SiteFooter";
import AuthAwareContent from "@/components/AuthAwareContent";

export default function AboutPage() {
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
                        <span>GAMING HUB</span>
                    </div>
                </Link>


                <AuthAwareContent
                    guest={
                        <Link href="/login" className={styles.loginLink}>
                            Sign in →
                        </Link>
                    }
                    authenticated={
                        <Link href="/dashboard" className={styles.loginLink}>
                            Dashboard →
                        </Link>
                    }
                />

            </header>

            <article className={styles.container}>
                <div className={styles.intro}>
                    <span className={styles.eyebrow}>
                        LEGAL INFORMATION
                    </span>

                    <h1>Terms of Service</h1>

                    <p>
                        Guidelines for using the ClutchMetrics
                        platform and its community features.
                    </p>

                    <small>Last updated: October 27, 2026</small>
                </div>

                <section className={styles.section}>
                    <h2>1. About ClutchMetrics</h2>

                    <p>
                        ClutchMetrics is a competitive gaming platform focused on performance analytics, match tracking, video clips and community challenges.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. User Accounts</h2>

                    <p>
                        Users must provide accurate information
                        when registering and are responsible
                        for maintaining the confidentiality
                        of their account credentials.
                    </p>

                    <p>
                        Email verification may be required
                        before accessing platform features.
                    </p>
                </section>


                <section className={styles.section}>
                    <h2>3. Community Content and Player Profiles</h2>

                    <p>
                        ClutchMetrics allows users to customize public
                        player profiles, upload avatars, add social media
                        links, follow other players, publish clips and
                        interact through likes and comments.
                    </p>

                    <p>
                        Users are responsible for the information and
                        content they share, including profile details,
                        uploaded videos, comments and external links.
                        Users should only submit content they are
                        authorized to use and should avoid sharing
                        sensitive personal information publicly.
                    </p>

                    <p>
                        Content that violates community rules, infringes
                        third-party rights or contains inappropriate
                        material may be reported, reviewed and removed
                        by administrators.
                    </p>
                </section>


                <section className={styles.section}>
                    <h2>4. Free and Premium Plans</h2>

                    <p>
                        ClutchMetrics offers Free and Premium account plans. Available features may vary depending on the selected plan. Additional features may be introduced as the platform evolves. No payments are currently collected through the platform.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>5. Platform Availability</h2>

                    <p>
                        We continuously work to improve ClutchMetrics. Features may be updated, modified or temporarily unavailable during maintenance.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>6. Support and Questions</h2>

                    <p>
                        For information about using ClutchMetrics,
                        visit the Help Center or contact the
                        project team through the available
                        support channels.
                    </p>

                    <Link href="/help#contact" className={styles.inlineLink}>
                        Visit Contact & Support →
                    </Link>
                </section>

                <div className={styles.notice}>
                    For questions about these Terms of Service, please visit our Help Center and Support section.
                </div>
            </article>
        </main>
            <SiteFooter />
        </>
    );
}
