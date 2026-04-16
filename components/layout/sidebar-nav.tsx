"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Map,
  ShieldCheck,
  Users,
} from "lucide-react";

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

export function SidebarNav({ role }: { role: ProfileRole | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <GraduationCap className="h-5 w-5 text-accent" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-secondary">
            Training Planner
          </div>
          <div className="text-xs text-[rgba(244,253,217,0.6)]">
            WorldSkills roadmap
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                "hover:bg-[rgba(219,253,107,0.08)]",
                active
                  ? "bg-[rgba(219,253,107,0.12)] text-secondary shadow-[inset_0_0_0_1px_rgba(219,253,107,0.20)]"
                  : "text-[rgba(244,253,217,0.75)]"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-accent" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {role === "admin" ? (
          <Link
            href="/dashboard/users"
            className={cn(
              "group mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              "hover:bg-[rgba(219,253,107,0.08)]",
              pathname.startsWith("/dashboard/users")
                ? "bg-[rgba(219,253,107,0.12)] text-secondary shadow-[inset_0_0_0_1px_rgba(219,253,107,0.20)]"
                : "text-[rgba(244,253,217,0.75)]"
            )}
          >
            <Users className="h-5 w-5" />
            <span>Users</span>
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto pt-4 text-xs text-[rgba(244,253,217,0.5)]">
        {role ? `Role: ${role}` : ""}
      </div>
    </aside>
  );
}

