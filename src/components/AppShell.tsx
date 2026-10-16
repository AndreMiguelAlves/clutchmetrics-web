"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Swords,
  Gamepad2,
  Clapperboard,
  Radio,
  Trophy,
  CreditCard,
  UserRound,
  LogOut,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  title: string;
}

const menuItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Matches",
    href: "/matches",
    icon: Swords,
  },
  {
    label: "Game Accounts",
    href: "/game-accounts",
    icon: Gamepad2,
  },
];

const communityItems = [
  {
    label: "Clips",
    href: "/clips",
    icon: Clapperboard,
  },
  {
    label: "Feed",
    href: "/feed",
    icon: Radio,
  },
  {
    label: "Challenges",
    href: "/challenges",
    icon: Trophy,
  },
];

const accountItems = [
  {
    label: "Subscription",
    href: "/subscription",
    icon: CreditCard,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export default function AppShell({
  children,
  title,
}: AppShellProps) {
  const pathname = usePathname();

  const router = useRouter();

  const [checkingSession, setCheckingSession] =
      useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const response = await authenticatedFetch(
            "http://localhost:8080/api/auth/me"
        );

        if (!response.ok) {
          throw new Error("Invalid session");
        }

        setCheckingSession(false);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        router.replace("/login");
      }
    }

    verifySession();
  }, [router]);

  async function handleLogout() {
    const refreshToken =
        localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch(
            "http://localhost:8080/api/auth/logout",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refreshToken,
              }),
            }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      router.push("/login");
      router.refresh();
    }
  }

  function renderItem(item: (typeof menuItems)[number]) {
    const Icon = item.icon;
    const active = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`shared-nav-item ${
          active ? "active" : ""
        }`}
      >
        <Icon size={18} strokeWidth={1.8} />

        <span>{item.label}</span>
      </Link>
    );
  }

  if (checkingSession) {
    return (
        <main className="shared-session-loading">
          Loading...
        </main>
    );
  }

  return (
    <main className="shared-app-shell">
      <aside className="shared-sidebar">
        <div className="shared-brand">
          <div className="shared-brand-mark">
            CM
          </div>

          <div>
            <strong>ClutchMetrics</strong>
            <span>PERFORMANCE HUB</span>
          </div>
        </div>

        <nav className="shared-navigation">
          <p className="shared-nav-label">
            WORKSPACE
          </p>

          {menuItems.map(renderItem)}

          <p className="shared-nav-label">
            COMMUNITY
          </p>

          {communityItems.map(renderItem)}

          <p className="shared-nav-label">
            ACCOUNT
          </p>

          {accountItems.map(renderItem)}

          <button
              type="button"
              className="shared-nav-item shared-logout-button"
              onClick={handleLogout}
          >
            <LogOut
                size={18}
                strokeWidth={1.8}
            />

            <span>Logout</span>
          </button>

        </nav>

        <div className="shared-sidebar-bottom">
          <div className="shared-premium-card">
            <span>FREE PLAN</span>

            <strong>
              Unlock more analytics
            </strong>

            <p>
              Upgrade for unlimited insights
              and exports.
            </p>

            <Link href="/subscription">
              View Premium
            </Link>
          </div>
        </div>
      </aside>

      <section className="shared-main">
        <header className="shared-topbar">
          <div>
            <span>CLUTCHMETRICS</span>
            <strong>{title}</strong>
          </div>
        </header>

        <div className="shared-page-content">
          {children}
        </div>
      </section>
    </main>
  );
}