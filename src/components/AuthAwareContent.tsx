
"use client";

import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";

type AuthAwareContentProps = {
    guest: ReactNode;
    authenticated: ReactNode;
};

function subscribeToAuthChanges(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);

    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("focus", onChange);
    };
}

function getAuthSnapshot() {
    return Boolean(
        localStorage.getItem("accessToken") ||
        localStorage.getItem("refreshToken")
    );
}

function getServerSnapshot() {
    return false;
}

export default function AuthAwareContent({
                                             guest,
                                             authenticated,
                                         }: AuthAwareContentProps) {
    const hasSession = useSyncExternalStore(
        subscribeToAuthChanges,
        getAuthSnapshot,
        getServerSnapshot
    );

    return hasSession ? authenticated : guest;
}
