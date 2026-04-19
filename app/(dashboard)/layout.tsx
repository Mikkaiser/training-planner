import { redirect } from "next/navigation";

import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types";

/** Always read fresh session + profile (role) from Supabase, not a static shell cache. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? null) as ProfileRole | null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative z-[1] flex min-h-screen flex-col">
        <AppHeader
          fullName={profile?.full_name ?? null}
          email={user.email ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          role={role}
        />
        <div className="mx-auto grid min-h-0 w-full max-w-screen-2xl flex-1 grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
          <div className="hidden md:block">
            <div className="glass-strong !rounded-none border-0 border-r border-border">
              <SidebarNav role={role} />
            </div>
          </div>

          <div className="min-w-0">{children}</div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}

