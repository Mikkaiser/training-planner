"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ThemedLogo } from "@/components/brand/themed-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: Map },
  { href: "/phases", label: "Phases", icon: Layers },
] as const;

/** Only one item active: `/dashboard` matches the home route only, not nested paths. */
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface SidebarNavProps {
  role: ProfileRole | null;
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  /** Called after a nav link is activated (e.g. close mobile sheet). */
  onNavigate?: () => void;
}

export function SidebarNav({
  role,
  fullName = null,
  email = null,
  avatarUrl = null,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const usersActive = isNavItemActive(pathname, "/dashboard/users");

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sign out.");
    }
  }

  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ?? "U";

  const accountLabel = fullName ?? email ?? "Account";

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

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-3 px-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "hover-tint h-[50px] flex-1 justify-start gap-3 border-border bg-[var(--color-surface-raised)] px-4 text-tp-primary backdrop-blur-md"
              )}
            >
              <Avatar className="my-1 h-9 w-9 flex-shrink-0">
                <AvatarImage
                  src={avatarUrl ?? undefined}
                  alt={fullName ?? "User"}
                />
                <AvatarFallback className="bg-[var(--color-accent-muted)] text-tp-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 truncate text-[17px]">{accountLabel}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="space-y-0.5">
                  <div className="text-sm font-medium text-tp-primary">
                    {fullName ?? "Signed in"}
                  </div>
                  <div className="text-xs text-tp-secondary">{email ?? ""}</div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer focus:bg-[var(--color-accent-muted)]"
                >
                  <LogOut className="mr-2 h-[25px] w-[25px] text-primary" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
