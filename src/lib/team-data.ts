import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { query, queryOne, TS } from "@/lib/db";
import { APP_ROUTES } from "@/lib/routes";

/**
 * Turns a session into a scope.
 *
 * Every read and every write in the app now filters on `team_id`, and this is
 * the only place that decides what that value is. It is deliberately not a
 * cookie: `view-modes.ts` documents that a non-HttpOnly cookie is
 * attacker-controlled, and this one decides which trainer's plans come back.
 *
 * Membership is re-checked on every resolution rather than trusted from
 * `users.active_team_id`, so removing someone from a team takes effect on their
 * next request instead of whenever they happen to switch.
 */

export type TeamRole = "owner" | "member";

export type ActiveTeam = {
  userId: string;
  teamId: string;
  teamName: string;
  isPersonal: boolean;
  role: TeamRole;
};

export type TeamOption = {
  id: string;
  name: string;
  isPersonal: boolean;
  role: TeamRole;
  memberCount: number;
};

async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect(APP_ROUTES.login);
  return id;
}

/**
 * The team whose data the caller is currently looking at.
 *
 * Falls back to the personal team when `active_team_id` is stale — which is
 * exactly what a removed member's pointer becomes. Without the fallback they
 * would see an empty app with no explanation rather than their own plans.
 */
export async function getActiveTeam(): Promise<ActiveTeam> {
  const userId = await requireSessionUserId();

  const active = await queryOne<{
    team_id: string;
    name: string;
    is_personal: boolean;
    role: TeamRole;
  }>(
    `select t.id as team_id, t.name, t.is_personal, tm.role
       from users u
       join teams t on t.id = u.active_team_id
       join team_members tm on tm.team_id = t.id and tm.user_id = u.id
      where u.id = $1`,
    [userId],
  );

  if (active) {
    return {
      userId,
      teamId: active.team_id,
      teamName: active.name,
      isPersonal: active.is_personal,
      role: active.role,
    };
  }

  const personal = await queryOne<{ team_id: string; name: string; role: TeamRole }>(
    `select t.id as team_id, t.name, tm.role
       from teams t
       join team_members tm on tm.team_id = t.id
      where tm.user_id = $1 and t.is_personal
      order by t.created_at
      limit 1`,
    [userId],
  );

  if (!personal) {
    // Only reachable for a user created before this migration ran, or by a
    // adapter insert that bypassed it. Better to say so than to serve an empty
    // app that looks like data loss.
    throw new Error("No team found for this account. Sign out and in again, or contact support.");
  }

  await queryOne("update users set active_team_id = $2 where id = $1 returning id", [
    userId,
    personal.team_id,
  ]);

  return {
    userId,
    teamId: personal.team_id,
    teamName: personal.name,
    isPersonal: true,
    role: personal.role,
  };
}

/** Every team the caller belongs to, for the switcher. */
export async function getTeamsForCurrentUser(): Promise<TeamOption[]> {
  const userId = await requireSessionUserId();

  return query<TeamOption>(
    `select t.id, t.name, t.is_personal as "isPersonal", tm.role,
            (select count(*) from team_members m where m.team_id = t.id)::int as "memberCount"
       from teams t
       join team_members tm on tm.team_id = t.id
      where tm.user_id = $1
      order by t.is_personal desc, t.name`,
    [userId],
  );
}

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string;
  role: TeamRole;
  joinedAt: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
};

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const userId = await requireSessionUserId();

  return query<TeamMember>(
    `select u.id as "userId", u.name, u.email, tm.role, ${TS("tm.joined_at", '"joinedAt"')}
       from team_members tm
       join users u on u.id = tm.user_id
      where tm.team_id = $1
        and exists (select 1 from team_members me where me.team_id = $1 and me.user_id = $2)
      order by tm.role, u.email`,
    [teamId, userId],
  );
}

/** Open invitations. Only an owner can see them — they are live credentials. */
export async function getPendingInvites(teamId: string): Promise<PendingInvite[]> {
  const userId = await requireSessionUserId();

  return query<PendingInvite>(
    `select i.id, i.email, ${TS("i.expires_at", '"expiresAt"')}, ${TS("i.created_at", '"createdAt"')}
       from team_invites i
      where i.team_id = $1
        and i.accepted_at is null
        and i.expires_at > now()
        and exists (
          select 1 from team_members me
           where me.team_id = $1 and me.user_id = $2 and me.role = 'owner'
        )
      order by i.created_at desc`,
    [teamId, userId],
  );
}

/**
 * The scope for a server action. Throws rather than redirecting, matching the
 * `requireUserId` helpers it replaces — a redirect from inside an action is not
 * what a submitted form should get.
 *
 * Returns both ids together on purpose: every write needs the team to scope by
 * and the user to record as `created_by`, and fetching them separately is how a
 * call site ends up scoping by one and stamping the other.
 */
export async function requireTeamContext(): Promise<{ userId: string; teamId: string; role: TeamRole }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You need to sign in first.");

  const active = await queryOne<{ team_id: string; role: TeamRole }>(
    `select t.id as team_id, tm.role
       from users u
       join teams t on t.id = u.active_team_id
       join team_members tm on tm.team_id = t.id and tm.user_id = u.id
      where u.id = $1
      union all
     select t.id, tm.role
       from teams t
       join team_members tm on tm.team_id = t.id
      where tm.user_id = $1 and t.is_personal
      limit 1`,
    [userId],
  );

  if (!active) throw new Error("No team found for this account.");
  return { userId, teamId: active.team_id, role: active.role };
}
