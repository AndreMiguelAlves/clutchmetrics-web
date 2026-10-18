"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            try {
                const response = await authenticatedFetch(
                    "http://localhost:8080/api/auth/me"
                );

                if (!response.ok) {
                    throw new Error("Invalid session");
                }

                router.replace("/dashboard");
            } catch {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                router.replace("/login");
            }
        }

        checkSession();
    }, [router]);

    return (
        <main className="shared-session-loading">
            Loading...
        </main>
    );
}