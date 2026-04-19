"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TrainingPlannerLogo } from "@/components/brand/training-planner-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

type Props = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: ProfileRole | null;
};

export function AppHeader({ fullName, email, avatarUrl, role }: Props) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  return (
    <header className="app-header-bar sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden border-border bg-transparent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0 text-tp-primary">
            <SidebarNav
              role={role}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center py-1"
          aria-label="Training Planner home"
        >
          <TrainingPlannerLogo variant="header" />
        </Link>

        <div className="min-w-0 flex-1" />

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-10 gap-3 border-border bg-[var(--color-surface-raised)] px-3 text-tp-primary backdrop-blur-md hover:bg-[var(--color-accent-muted)]"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={avatarUrl ?? undefined}
                alt={fullName ?? "User"}
              />
              <AvatarFallback className="bg-[var(--color-accent-muted)] text-tp-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm md:inline">
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
                <LogOut className="mr-2 h-5 w-5 text-primary" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
