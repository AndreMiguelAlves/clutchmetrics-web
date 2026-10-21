"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";

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
  Users,
  ScrollText,
  KeyRound,
  ShieldAlert,
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

  {
    label: "Creator Studio",
    href: "/clips",
    icon: Clapperboard,
  },


];


const communityItems = [
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
  {
    label: "Change Password",
    href: "/change-password",
    icon: KeyRound,
  },
];

const adminItems = [
  {
    label: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
  },

  {
    label: "Content Reports",
    href: "/admin/clip-reports",
    icon: ShieldAlert,
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
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function verifySession() {
      try {
        const response = await authenticatedFetch(
            "http://localhost:8080/api/auth/me"
        );

        if (!response.ok) {
          throw new Error("Invalid session");
        }

        const data = await response.json();

        setRoles(data.roles ?? []);
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
        <Link href="/dashboard" className="shared-brand">
          <div className="shared-brand-mark">
            <Image
                src="/clutchmetrics-icon.png"
                alt="ClutchMetrics"
                width={46}
                height={46}
                className="shared-brand-logo"
            />
          </div>

          <div>
            <strong>ClutchMetrics</strong>
            <span>PERFORMANCE HUB</span>
          </div>
        </Link>

        <nav className="shared-navigation">
          <p className="shared-nav-label">
            WORKSPACE
          </p>

          {menuItems.map(renderItem)}

          <p className="shared-nav-label">
            COMMUNITY
          </p>

          {communityItems.map(renderItem)}

          {roles.includes("ADMIN") && (
              <>
                <p className="shared-nav-label">
                  ADMIN
                </p>

                {adminItems.map(renderItem)}
              </>
          )}

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

        <SiteFooter />

      </section>

      <ChatWidget />
    </main>

  );
}