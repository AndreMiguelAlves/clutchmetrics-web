
import Image from "next/image";
import Link from "next/link";
import styles from "../legal.module.css";
import SiteFooter from "@/components/SiteFooter";
import AuthAwareContent from "@/components/AuthAwareContent";

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

                    <h1>Privacy Policy</h1>

                    <p>
                        Learn how ClutchMetrics handles account
                        information, gaming statistics and
                        community content.
                    </p>

                    <small>Last updated: October 27, 2026</small>
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
                        ClutchMetrics processes account information,
                        including usernames, email addresses and
                        securely hashed passwords. Authentication
                        and verification tokens are also used to
                        support account security.
                    </p>

                    <p>
                        Players can provide profile information,
                        including display names, biographies,
                        profile pictures and links to external
                        social media accounts.
                    </p>

                    <p>
                        The platform stores information related
                        to connected game accounts, match history,
                        performance statistics, video uploads,
                        clips and challenge participation.
                    </p>

                    <p>
                        Community information includes published
                        content, likes, comments, content reports
                        and relationships between followers
                        and followed players.
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
                        ClutchMetrics allows players to create public
                        profiles that may display their usernames,
                        display names, biographies, profile pictures
                        and social media links.
                    </p>

                    <p>
                        Public player profiles may also display
                        published clips, follower counts and
                        following counts. Signed-in users can
                        discover other players, follow them and
                        view their Followers and Following lists.
                    </p>

                    <p>
                        Content shared through the community Feed,
                        including published clips and comments,
                        may be visible to other users.
                        Users should avoid sharing sensitive
                        or personal information publicly.
                    </p>

                    <p>
                        Private account information, such as
                        email addresses and stored password
                        hashes, is not displayed on public
                        player profiles.
                    </p>
                </section>



                <section className={styles.section}>
                    <h2>6. External Content and Social Links</h2>

                    <p>
                        Some clips may reference videos hosted on
                        external platforms. Players can also add
                        links to supported social media accounts,
                        including YouTube, Twitch, TikTok and Instagram.
                    </p>

                    <p>
                        When users open external links, they leave
                        ClutchMetrics and access third-party services.
                        These platforms operate under their own
                        privacy policies and terms of use.
                    </p>
                </section>



                <section className={styles.section}>
                    <h2>7. Data Retention and Changes</h2>

                    <p>
                        ClutchMetrics stores account information,
                        gaming data and community content to support
                        the features available within the platform.
                    </p>

                    <p>
                        Data retention and account management
                        procedures may change as the project evolves.
                        Users can contact the project team through
                        the Help Center with questions about their
                        personal information.
                    </p>

                    <p>
                        This Privacy Policy may be updated to
                        reflect changes to the platform and
                        its data processing practices.
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
