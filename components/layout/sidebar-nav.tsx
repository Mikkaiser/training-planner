"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  Map,
  Users,
} from "lucide-react";

import { ThemedLogo } from "@/components/brand/themed-logo";
import type { ProfileRole } from "@/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Plans", icon: Map },
  { href: "/dashboard/phases", label: "Phases", icon: Layers },
] as const;

/** Only one item active: `/dashboard` matches the home route only, not nested paths. */
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: ProfileRole | null;
  /** Called after a nav link is activated (e.g. close mobile sheet). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const usersActive = isNavItemActive(pathname, "/dashboard/users");

  return (
    <aside className="relative z-10 flex h-full flex-col px-4 py-6">
      <Link
        href="/dashboard"
        onClick={() => onNavigate?.()}
        className="mb-7 flex flex-col items-center rounded-lg px-1 text-center transition-opacity hover:opacity-90"
        aria-label="Training Planner home"
      >
        <ThemedLogo
          variant="sidebarFull"
          priority
          className="h-auto w-[160px]"
        />
      </Link>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              aria-current={active ? "page" : undefined}
              className={cn(
                "sidebar-nav-link flex items-center gap-3 rounded-[10px] no-underline",
                active
                  ? "nav-item-active"
                  : "text-tp-muted"
              )}
            >
              <Icon
                className={cn(
                  "size-[22px] shrink-0",
                  active ? "text-[var(--color-accent)]" : "text-tp-muted"
                )}
                strokeWidth={2}
              />
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}

        {role === "admin" ? (
          <Link
            href="/dashboard/users"
            onClick={() => onNavigate?.()}
            aria-current={usersActive ? "page" : undefined}
            className={cn(
              "sidebar-nav-link mt-2 flex items-center gap-3 rounded-[10px] no-underline",
              usersActive
                ? "nav-item-active"
                : "text-tp-muted"
            )}
          >
            <Users
              className={cn(
                "size-[22px] shrink-0",
                usersActive ? "text-[var(--color-accent)]" : "text-tp-muted"
              )}
              strokeWidth={2}
            />
            <span className="min-w-0">Users</span>
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto pt-4" />
    </aside>
  );
}
