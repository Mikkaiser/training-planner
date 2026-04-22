"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { ProfileRole } from "@/types";

type Props = {
  role: ProfileRole | null;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function MobileNav({ role, fullName, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed left-5 top-5 z-40 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-[var(--color-surface-raised)] text-tp-primary backdrop-blur-md"
              aria-label="Open navigation"
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
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

