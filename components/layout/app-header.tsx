"use client";

import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type TopNavSection = "plans" | "exercises" | "competitors";

const TOP_NAV_ITEMS: Array<{ href: string; label: string; section: TopNavSection }> = [
  { href: "/plans", label: "Plans", section: "plans" },
  { href: "/exercises", label: "Exercises", section: "exercises" },
  { href: "/competitors", label: "Competitors", section: "competitors" },
];

function getActiveSection(pathname: string): TopNavSection {
  if (pathname === "/exercises" || pathname.startsWith("/exercises/")) {
    return "exercises";
  }

  if (pathname === "/competitors" || pathname.startsWith("/competitors/")) {
    return "competitors";
  }

  return "plans";
}

export function AppHeader({ fullName, email, avatarUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

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

  const ctaBySection: Record<TopNavSection, { label: string; href: string }> = {
    plans: { label: "+ New plan", href: "/plans/new" },
    exercises: { label: "+ New exercise", href: "/exercises/upload" },
    competitors: { label: "+ Add competitor", href: "/competitors" },
  };
  const cta = ctaBySection[activeSection];

  return (
    <header className="app-header-bar sticky top-0 z-40 font-body">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center gap-4 px-[45px]">
        <Link
          href="/plans"
          className="flex shrink-0 items-center py-1"
          aria-label="Training Planner home"
        >
          <ThemedLogo variant="headerMark" priority />
        </Link>

        <nav className="ml-2 flex min-w-0 items-center gap-2">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.section;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "app-top-nav-item rounded-[10px] px-3 py-2 text-sm transition",
                  isActive ? "app-top-nav-item--active" : "app-top-nav-item--inactive"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1" />

        <Link
          href={cta.href}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "tp-nav-cta-btn hidden md:inline-flex"
          )}
        >
          <Plus className="mr-1 h-4 w-4" />
          {cta.label}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "hover-tint h-[50px] gap-3 border-border bg-[var(--color-surface-raised)] px-4 text-tp-primary backdrop-blur-md"
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
            <span className="hidden text-[19px] md:inline">
              {fullName ?? email ?? "Account"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
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
    </header>
  );
}
