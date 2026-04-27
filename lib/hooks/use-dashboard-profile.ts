"use client";

import { useQuery } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types";

export type DashboardProfile = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: ProfileRole | null;
};

async function fetchDashboardProfile(): Promise<DashboardProfile> {
  const supabase = getSupabaseBrowserClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) {
    return { fullName: null, email: null, avatarUrl: null, role: null };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr) throw profileErr;

  const oauthAvatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return {
    fullName: (profile?.full_name ?? null) as string | null,
    email: user.email ?? null,
    avatarUrl: ((profile?.avatar_url ?? oauthAvatarUrl) as string | null) ?? null,
    role: ((profile?.role ?? null) as ProfileRole | null) ?? null,
  };
}

export function useDashboardProfile() {
  return useQuery({
    queryKey: ["dashboard-profile"],
    queryFn: fetchDashboardProfile,
    staleTime: 60_000,
  });
}

