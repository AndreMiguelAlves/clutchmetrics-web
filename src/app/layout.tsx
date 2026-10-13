import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "ClutchMetrics",
    description: "Esports performance and analytics platform",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={spaceGrotesk.className}>
        {children}
        </body>
        </html>
    );
}