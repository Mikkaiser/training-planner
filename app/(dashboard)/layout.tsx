import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import BackgroundBlobs from "@/components/layout/background-blobs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const oauthAvatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <BackgroundBlobs />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader
          fullName={profile?.full_name ?? null}
          email={user.email ?? null}
          avatarUrl={profile?.avatar_url ?? oauthAvatarUrl}
        />
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col overflow-auto px-[45px] py-[40px]">
          {children}
        </main>
      </div>
    </div>
  );
}

