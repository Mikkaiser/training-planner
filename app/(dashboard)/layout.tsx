import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import BackgroundBlobs from "@/components/layout/BackgroundBlobs";
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundBlobs />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          height: "100vh",
          width: 300,
          minWidth: 300,
          overflow: "hidden",
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
        className="hidden md:block"
      >
        <SidebarNav role={role} />
      </div>

      <main
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <AppHeader
          fullName={profile?.full_name ?? null}
          email={user.email ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          role={role}
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          className="mx-auto w-full max-w-[1400px] px-[45px] py-[40px]"
        >
          {children}
        </div>
      </main>
    </div>
  );
}

