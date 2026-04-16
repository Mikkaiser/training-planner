import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types";

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
    <div className="min-h-screen bg-accent-radial">
      <AppHeader
        fullName={profile?.full_name ?? null}
        email={user.email ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        role={role}
      />
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <div className="glass-panel border-accent-border/70 bg-[rgba(35,39,61,0.55)] shadow-glow">
            <SidebarNav role={role} />
          </div>
        </div>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

