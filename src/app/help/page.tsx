
import Image from "next/image";
import Link from "next/link";
import styles from "./help.module.css";
import SiteFooter from "@/components/SiteFooter";
import AuthAwareContent from "@/components/AuthAwareContent";


const faqs = [
    {
        question: "How do I create and verify my account?",
        answer:
            "Create an account on the registration page. You will receive a verification email with a confirmation link. Open the link to activate your account before signing in.",
    },
    {
        question: "Which games does ClutchMetrics support?",
        answer:
            "ClutchMetrics currently supports League of Legends, Valorant and Counter-Strike 2.",
    },
    {
        question: "How do I connect my game accounts?",
        answer:
            "Open Game Accounts, choose a supported game and enter the requested account information, including the appropriate region. You can manage, disconnect or reconnect your game accounts from this page.",
    },
    {
        question: "How can I track my performance?",
        answer:
            "Use the Overview, Matches and Analytics pages to explore your match history, KDA, win rate and other performance statistics. You can filter your results by game and other available criteria.",
    },
    {
        question: "How do I create and publish a clip?",
        answer:
            "Open Creator Studio to upload a video or add one from a URL. Process your video, use the Video Editor to select a segment or keep the original, then export your clip. You can also publish your content to the community Feed.",
    },
    {
        question: "What is the difference between Free and Premium?",
        answer:
            "Free users can export videos up to 720p. Premium users can export videos up to 1080p and access All Time performance analytics. Visit the Subscription page to compare your available features.",
    },
    {
        question: "How do I find and follow other players?",
        answer:
            "Open Discover Players from the Community menu. Search by username or display name, visit a player's public profile and select Follow Player. You can also view their Followers and Following lists.",
    },
    {
        question: "How do I customize my player profile?",
        answer:
            "Open Profile to update your display name, biography and avatar. You can also add supported social media links. Other players can view your public profile, published highlights and social information.",
    },
    {
        question: "How can I report inappropriate content?",
        answer:
            "Open the Feed, find the relevant clip and select Report. Choose a reason and submit your report. An administrator can review reports and take appropriate moderation actions.",
    },
    {
        question: "How do sponsored challenges work?",
        answer:
            "Visit Challenges to explore available objectives and rewards. Join a challenge to participate and follow its progress. Challenge completion depends on meeting the requirements defined for each objective.",
    },
    {
        question: "How do I reset or change my password?",
        answer:
            "If you cannot access your account, select Forgot Password on the Login page and follow the email instructions. If you are already signed in, use Change Password in the Account menu to update your password.",
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
                <section className={styles.hero}>
                    <span className={styles.eyebrow}>
                        SUPPORT CENTER
                    </span>

                    <h1>How can we help?</h1>

                    <p>
                        Find answers to frequently asked questions
                        about ClutchMetrics.
                    </p>
                </section>

                <section className={styles.section} id="faq">
                    <span className={styles.eyebrow}>
                        FREQUENTLY ASKED QUESTIONS
                    </span>

                    <h2>Help Center / FAQ</h2>

                    <div className={styles.faqList}>
                        {faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className={styles.faqItem}
                            >
                                <summary>
                                    {faq.question}
                                </summary>

                                <p>{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section
                    className={styles.contact}
                    id="contact"
                >
                    <span className={styles.eyebrow}>
                        NEED MORE HELP?
                    </span>

                    <h2>Contact & Support</h2>

                    <p>
                        Need help with your account, gaming statistics,
                        clips or subscriptions? Our support team is here
                        to help you.
                    </p>


                    <div className={styles.contactActions}>
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=clutchmetrics.support%40gmail.com&su=ClutchMetrics%20Support%20Request"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.emailButton}
                        >
                            Email Support →
                        </a>
                    </div>

                    <p className={styles.contactEmail}>
                        Support email: clutchmetrics.support@gmail.com
                    </p>

                    <AuthAwareContent
                        guest={
                            <p className={styles.contactEmail}>
                                Need a quick answer? Sign in to access
                                the ClutchMetrics chat assistant.
                            </p>
                        }
                        authenticated={
                            <p className={styles.contactEmail}>
                                Need a quick answer? Use the purple chat
                                icon in the bottom-right corner of any app page.
                            </p>
                        }
                    />


                </section>
            </div>
        </main>
            <SiteFooter />
        </>
    );
}
