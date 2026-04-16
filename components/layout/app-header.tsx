"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types";
import { SidebarNav } from "./sidebar-nav";

type Props = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: ProfileRole | null;
};

export function AppHeader({ fullName, email, avatarUrl, role }: Props) {
  const router = useRouter();

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
    <header className="sticky top-0 z-40 border-b border-accent-border/60 bg-[rgba(28,31,51,0.55)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden border-accent-border bg-transparent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="glass-panel w-72 border-accent-border/70 bg-[rgba(35,39,61,0.7)] p-0 text-secondary"
          >
            <SidebarNav role={role} />
          </SheetContent>
        </Sheet>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="h-10 gap-3 border-accent-border/70 bg-[rgba(35,39,61,0.45)] px-3 text-secondary hover:bg-[rgba(35,39,61,0.65)]"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt={fullName ?? "User"}
                  />
                  <AvatarFallback className="bg-[rgba(219,253,107,0.15)] text-[rgba(244,253,217,0.9)]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:inline">
                  {fullName ?? email ?? "Account"}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="glass-panel w-64 border-accent-border/70 bg-[rgba(35,39,61,0.8)] text-secondary"
          >
            <DropdownMenuLabel className="space-y-0.5">
              <div className="text-sm font-medium text-secondary">
                {fullName ?? "Signed in"}
              </div>
              <div className="text-xs text-[rgba(244,253,217,0.65)]">
                {email ?? ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-accent-border/60" />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer focus:bg-[rgba(219,253,107,0.12)]"
            >
              <LogOut className="mr-2 h-5 w-5 text-accent" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

