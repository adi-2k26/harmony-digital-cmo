"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { mutate as globalMutate } from "swr";
import { apiFetch } from "../lib/api";
import { AGENT_ROUTE_PREFIX, PRIMARY_NAV, type SearchItem } from "../lib/nav";
import { SearchPalette } from "./SearchPalette";

const NAV_SECTION_ORDER = ["Core", "Modules"] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const { data: me, error: meError, isLoading: meLoading } = useSWR(
    isLoginPage ? null : "/api/auth/me",
    apiFetch<{ username: string }>,
    {
      // Session changes only on login/logout, so avoid aggressive revalidation in dev.
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      focusThrottleInterval: 60_000,
      shouldRetryOnError: false,
    }
  );
  const { data: catalog } = useSWR(
    isLoginPage || !me ? null : "/agents/catalog",
    apiFetch<{ agents: { id: string; name: string }[] }>
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const agentItems: SearchItem[] = useMemo(() => {
    if (!catalog?.agents) return [];
    return catalog.agents.map((a) => ({
      id: `agent-${a.id}`,
      label: a.name,
      href: `${AGENT_ROUTE_PREFIX}${a.id}` as Route,
      group: "Specialists",
      keywords: `${a.name} ${a.id} agent`,
    }));
  }, [catalog]);

  const navByGroup = useMemo(() => {
    const acc: Record<string, SearchItem[]> = {};
    for (const item of PRIMARY_NAV) {
      const g = item.group;
      if (!acc[g]) acc[g] = [];
      acc[g].push(item);
    }
    return acc;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) return;
    if (meLoading) return;
    if (!meError) return;
    // Redirect only when session is actually unauthorized.
    // Other transient failures (dev rebuild, backend hiccup) should not bounce the UI.
    const isUnauthorized = meError instanceof Error && meError.message.includes("(401)");
    if (isUnauthorized) {
      router.replace("/login");
    }
  }, [isLoginPage, meLoading, meError, router]);

  useEffect(() => {
    const key = "hj_hybrid_bootstrap_done";
    if (typeof window === "undefined") return;
    if (isLoginPage) return;
    if (!me) return;
    if (window.sessionStorage.getItem(key) === "1") return;

    const run = async () => {
      try {
        const res = await fetch("/harmony-api/session/bootstrap-refresh", { method: "POST" });
        if (res.ok) {
          window.sessionStorage.setItem(key, "1");
          await globalMutate(
            (cacheKey) =>
              typeof cacheKey === "string" &&
              (cacheKey.startsWith("/dashboards/") || cacheKey.startsWith("/modules/") || cacheKey === "/actions"),
            undefined,
            { revalidate: true }
          );
          window.dispatchEvent(new CustomEvent("harmony-dashboard-refresh"));
        }
      } catch {
        // best effort bootstrap refresh
      }
    };
    void run();
  }, [isLoginPage, me]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_SECTION_ORDER.map((section) => {
          const items = navByGroup[section];
          if (!items?.length) return null;
          return (
            <div key={section}>
              <p className="sidebarSectionLabel">{section}</p>
              <nav className="sidebarNav" aria-label={section}>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={isActive(item.href) ? "sidebarNavLink active" : "sidebarNavLink"}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          );
        })}
      </>
    );
  }

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best effort
    }
    await globalMutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="appShell">
        <aside className={`appSidebar${sidebarOpen ? " open" : ""}`} aria-label="Main navigation">
          <div className="appSidebarInner">
            <div className="appBrandBlock">
              <Link href="/" className="appBrand">
                Harmony Jewels
                <span className="appBrandSub">Digital CMO</span>
              </Link>
            </div>
            <NavLinks onNavigate={() => setSidebarOpen(false)} />
            <div className="sidebarFooter">
              <button type="button" className="searchTrigger" onClick={() => setSearchOpen(true)}>
                Search <span className="kbd">⌘K</span>
              </button>
              <button type="button" className="searchTrigger" onClick={onLogout} style={{ marginTop: 8 }}>
                Logout
              </button>
            </div>
          </div>
        </aside>

        <button
          type="button"
          className={`sidebarBackdrop${sidebarOpen ? " open" : ""}`}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="appWorkspace">
          <div className="workspaceTopBar">
            <button type="button" className="menuToggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              Menu
            </button>
            <button type="button" className="searchTrigger" onClick={() => setSearchOpen(true)}>
              Search <span className="kbd">⌘K</span>
            </button>
          </div>
          <div className="appMain">{children}</div>
        </div>
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} items={[...PRIMARY_NAV, ...agentItems]} />
    </>
  );
}
