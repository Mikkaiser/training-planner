"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  Layers,
  LayoutDashboard,
  Map,
  ShieldCheck,
  Users,
} from "lucide-react";

import { TrainingPlannerLogo } from "@/components/brand/training-planner-logo";
import type { ProfileRole } from "@/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Plans", icon: Map },
  { href: "/dashboard/phases", label: "Phases", icon: Layers },
  { href: "/dashboard/subcompetences", label: "Subcompetences", icon: BookOpen },
  { href: "/dashboard/exercises", label: "Exercises", icon: FileText },
  { href: "/dashboard/gates", label: "Gates", icon: ShieldCheck },
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
    <aside className="relative z-10 flex h-full flex-col p-4">
      <Link
        href="/dashboard"
        onClick={() => onNavigate?.()}
        className="mb-5 flex flex-col items-center rounded-lg px-1 text-center transition-opacity hover:opacity-90"
        aria-label="Training Planner home"
      >
        <TrainingPlannerLogo variant="sidebar" />
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
                "sidebar-nav-link flex min-h-[2.25rem] items-center gap-3 rounded-[10px] px-3 py-2 no-underline",
                active
                  ? "nav-item-active"
                  : "text-tp-muted hover:bg-[var(--color-accent-muted)]"
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
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
              "sidebar-nav-link mt-2 flex min-h-[2.25rem] items-center gap-3 rounded-[10px] px-3 py-2 no-underline",
              usersActive
                ? "nav-item-active"
                : "text-tp-muted hover:bg-[var(--color-accent-muted)]"
            )}
          >
            <Users
              className={cn(
                "size-5 shrink-0",
                usersActive ? "text-[var(--color-accent)]" : "text-tp-muted"
              )}
              strokeWidth={2}
            />
            <span className="min-w-0">Users</span>
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto pt-4 text-xs text-tp-muted">
        {role ? `Role: ${role}` : ""}
      </div>
    </aside>
  );
}
