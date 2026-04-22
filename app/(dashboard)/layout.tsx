import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import BackgroundBlobs from "@/components/layout/background-blobs";
import { MobileNav } from "@/components/layout/mobile-nav";
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

  // Supabase `profiles.role` is validated in DB; constrain to our `ProfileRole` union.
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
        }}
        className="app-sidebar-glass hidden md:block"
      >
        <SidebarNav
          role={role}
          fullName={profile?.full_name ?? null}
          email={user.email ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
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
          <MobileNav
            role={role}
            fullName={profile?.full_name ?? null}
            email={user.email ?? null}
            avatarUrl={profile?.avatar_url ?? null}
          />
          {children}
        </div>
      </main>
    </div>
  );
}

