"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemedLogo } from "@/components/brand/themed-logo";
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
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center gap-3 px-[45px]">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden border-border bg-transparent"
              >
                <Menu className="h-[25px] w-[25px]" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-[360px] p-0 text-tp-primary">
            <SidebarNav
              role={role}
              fullName={fullName}
              email={email}
              avatarUrl={avatarUrl}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center py-1"
          aria-label="Training Planner home"
        >
          <ThemedLogo variant="headerMark" priority />
        </Link>

        <div className="min-w-0 flex-1" />

        <ThemeToggle />

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
