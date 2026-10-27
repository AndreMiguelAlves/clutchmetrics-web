
import Image from "next/image";
import Link from "next/link";
import styles from "./about.module.css";
import SiteFooter from "@/components/SiteFooter";
import AuthAwareContent from "@/components/AuthAwareContent";


const features = [
    {
        title: "Performance Analytics",
        description:
            "Analyze match history, KDA, win rate and performance trends. Use filters to explore your results across supported games.",
    },
    {
        title: "Creator Studio",
        description:
            "Upload videos, create and edit clips, export your highlights and publish them to the community Feed.",
    },
    {
        title: "Player Community",
        description:
            "Discover players, customize your public profile, follow other gamers and interact through clips, likes and comments.",
    },
    {
        title: "Sponsored Challenges",
        description:
            "Explore gaming challenges, join available competitions, track your progress and complete objectives.",
    },
    {
        title: "Game Accounts",
        description:
            "Connect and manage your supported game accounts, configure their regions and manage connection status.",
    },
    {
        title: "Free & Premium",
        description:
            "Start with Free features or unlock Premium benefits, including 1080p video exports and All Time performance analytics.",
    },
];


const games = [
    {
        name: "League of Legends",
        image: "/games/lol.png",
    },
    {
        name: "Valorant",
        image: "/games/valorant.png",
    },
    {
        name: "Counter-Strike 2",
        image: "/games/cs2.png",
    },
];

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

            <div className={styles.container}>
                <section className={styles.hero} id="why">
                    <span className={styles.eyebrow}>
                        ABOUT CLUTCHMETRICS
                    </span>

                    <h1>
                        Your game. Your data.
                        <span> Your edge.</span>
                    </h1>

                    <p>
                        ClutchMetrics brings together competitive
                        gaming statistics, match history, clips
                        and community challenges in one platform.
                    </p>
                </section>

                <section className={styles.section} id="features">
                    <span className={styles.eyebrow}>
                        THE PLATFORM
                    </span>

                    <h2>Key Features</h2>

                    <p className={styles.sectionDescription}>
                        Everything you need to track your
                        performance and share your gaming moments.
                    </p>

                    <div className={styles.featureGrid}>
                        {features.map((feature) => (
                            <article
                                key={feature.title}
                                className={styles.featureCard}
                            >
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.section} id="games">
                    <span className={styles.eyebrow}>
                        SUPPORTED TITLES
                    </span>

                    <h2>Supported Games</h2>

                    <p className={styles.sectionDescription}>
                        Explore your performance and gaming content
                        across three supported competitive titles.
                    </p>

                    <div className={styles.gameGrid}>
                        {games.map((game) => (
                            <div
                                key={game.name}
                                className={styles.gameCard}
                            >
                                <Image
                                    src={game.image}
                                    alt={game.name}
                                    width={58}
                                    height={58}
                                    className={styles.gameImage}
                                />

                                <strong>{game.name}</strong>
                            </div>
                        ))}
                    </div>
                </section>


                <AuthAwareContent
                    guest={
                        <div className={styles.cta}>
                            <h2>Ready to level up?</h2>

                            <p>
                                Join ClutchMetrics and start tracking
                                your competitive journey.
                            </p>

                            <Link href="/register">
                                Create an account →
                            </Link>
                        </div>
                    }
                    authenticated={
                        <div className={styles.cta}>
                            <h2>Ready for your next match?</h2>

                            <p>
                                Head back to your dashboard and keep
                                tracking your performance.
                            </p>

                            <Link href="/dashboard">
                                Go to Dashboard →
                            </Link>
                        </div>
                    }
                />

            </div>
        </main>
            <SiteFooter />
        </>
    );
}
