
import Image from "next/image";
import Link from "next/link";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
    compact?: boolean;
}

export default function SiteFooter({
                                       compact = false,
                                   }: SiteFooterProps) {
    return (
        <footer
            className={`${styles.footer} ${
                compact ? styles.compact : ""
            }`}
        >
            <div className={styles.content}>
                <div className={styles.brand}>
                    <Image
                        src="/clutchmetrics-icon.png"
                        alt="ClutchMetrics"
                        width={42}
                        height={42}
                    />

                    <div>
                        <strong>ClutchMetrics</strong>
                        <p>Your game. Your data. Your edge.</p>
                    </div>
                </div>

                <nav
                    className={styles.links}
                    aria-label="Footer navigation"
                >
                    <div className={styles.column}>
                        <h3>Platform</h3>

                        <Link href="/about#why">
                            Why ClutchMetrics?
                        </Link>

                        <Link href="/about#features">
                            Key Features
                        </Link>

                        <Link href="/about#games">
                            Supported Games
                        </Link>
                    </div>

                    <div className={styles.column}>
                        <h3>Support</h3>

                        <Link href="/help#faq">
                            Help Center / FAQ
                        </Link>

                        <Link href="/help#contact">
                            Contact Us
                        </Link>
                    </div>

                    <div className={styles.column}>
                        <h3>Legal</h3>

                        <Link href="/terms">
                            Terms of Service
                        </Link>

                        <Link href="/privacy">
                            Privacy Policy
                        </Link>
                    </div>
                </nav>
            </div>

            <div className={styles.bottom}>
                <span>
    © 2026 ClutchMetrics. All rights reserved.
</span>

                <span>
                    Built for players. Powered by performance.
                </span>
            </div>
        </footer>
    );
}
