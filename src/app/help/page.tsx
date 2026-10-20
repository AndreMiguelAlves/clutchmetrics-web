
import Image from "next/image";
import Link from "next/link";
import styles from "./help.module.css";
import SiteFooter from "@/components/SiteFooter";

const faqs = [
    {
        question: "How do I create and verify my account?",
        answer:
            "Create an account using the registration page. You will receive a verification email. Open the confirmation link to activate your account before signing in.",
    },
    {
        question: "Which games does ClutchMetrics support?",
        answer:
            "ClutchMetrics currently supports League of Legends, Valorant, Counter-Strike 2 and Rocket League.",
    },
    {
        question: "How can I track my performance?",
        answer:
            "Open your Dashboard or Analytics page to review match history, KDA, win rate and other performance statistics.",
    },
    {
        question: "How do I create and publish a clip?",
        answer:
            "Visit the Clips page, create a clip using a video URL and select its game. Once the clip is ready, you can publish it to the community Feed.",
    },
    {
        question: "How can I report inappropriate content?",
        answer:
            "Open the Feed, select Report on the relevant clip, choose a reason and submit your report. An administrator can then review it.",
    },
    {
        question: "What is the difference between Free and Premium?",
        answer:
            "ClutchMetrics offers Free and Premium subscription plans. Premium is intended for advanced features, some of which are still under development.",
    },
    {
        question: "How do sponsored challenges work?",
        answer:
            "Join an available challenge and complete its objective through eligible matches. Your progress is tracked automatically when matches are registered.",
    },
    {
        question: "How do I reset my password?",
        answer:
            "Select Forgot password on the Login page and follow the instructions sent to your email address.",
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
                        <span>PERFORMANCE HUB</span>
                    </div>
                </Link>

                <Link href="/login" className={styles.loginLink}>
                    Sign in →
                </Link>
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


                        <Link
                            href="/login"
                            className={styles.chatButton}
                        >
                            Chat with Assistant →
                        </Link>
                    </div>

                    <p className={styles.contactEmail}>
                        Or contact us directly at{" "}

                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=clutchmetrics.support%40gmail.com&su=ClutchMetrics%20Support%20Request"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            clutchmetrics.support@gmail.com
                        </a>

                    </p>

                </section>
            </div>
        </main>
            <SiteFooter />
        </>
    );
}
