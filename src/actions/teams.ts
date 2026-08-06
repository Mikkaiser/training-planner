"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import {
  hashInviteToken,
  inviteExpiryFrom,
  inviteState,
  isPlausibleEmail,
  mintInviteToken,
  normaliseInviteEmail,
} from "@/lib/invite-token";
import { APP_ROUTES } from "@/lib/routes";
import { requireTeamContext } from "@/lib/team-data";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("You need to sign in before managing teams.");
  return id;
}

/** Only an owner manages membership; every member has identical data access. */
async function requireOwnerOf(teamId: string, userId: string): Promise<void> {
  const row = await queryOne<{ role: string }>(
    "select role from team_members where team_id = $1 and user_id = $2",
    [teamId, userId],
  );

  if (!row) throw new Error("Team not found, or you are not a member of it.");
  if (row.role !== "owner") throw new Error("Only the team's owner can do that.");
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

const createTeamSchema = z.object({ name: z.string().min(1).max(120) });

export async function createTeam(input: z.input<typeof createTeamSchema>): Promise<{ id: string }> {
  const userId = await requireUserId();
  const parsed = createTeamSchema.parse(input);

  const client = await pool.connect();
  try {
    await client.query("begin");

    const team = await client.query<{ id: string }>(
      "insert into teams (name, is_personal, created_by) values ($1, false, $2) returning id",
      [parsed.name.trim(), userId],
    );
    const teamId = team.rows[0].id;

    await client.query(
      "insert into team_members (team_id, user_id, role) values ($1, $2, 'owner')",
      [teamId, userId],
    );
    // Land in the team just created; otherwise it exists but nothing on screen
    // changes, which reads as the button having done nothing.
    await client.query("update users set active_team_id = $2 where id = $1", [userId, teamId]);

    await client.query("commit");
    revalidatePath("/", "layout");
    return { id: teamId };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

const renameTeamSchema = z.object({ teamId: z.string().uuid(), name: z.string().min(1).max(120) });

export async function renameTeam(input: z.input<typeof renameTeamSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = renameTeamSchema.parse(input);
  await requireOwnerOf(parsed.teamId, userId);

  const row = await queryOne(
    "update teams set name = $2 where id = $1 and not is_personal returning id",
    [parsed.teamId, parsed.name.trim()],
  );

  if (!row) throw new Error("A personal team cannot be renamed.");
  revalidatePath("/", "layout");
}

export type InviteResult = {
  /** The link, always. Email delivery is separate and may have failed. */
  acceptUrl: string;
  emailSent: boolean;
  emailError: string | null;
};

const inviteSchema = z.object({ teamId: z.string().uuid(), email: z.string().min(3).max(254) });

/**
 * Invites someone by email.
 *
 * The invitation is recorded and the link returned whatever happens to the
 * email: delivery fails for reasons the app cannot see — a spam filter, a typo,
 * a domain not yet verified with Resend — and an invitation you cannot pass on
 * by hand is one that silently did not happen.
 */
export async function inviteMember(input: z.input<typeof inviteSchema>): Promise<InviteResult> {
  const userId = await requireUserId();
  const parsed = inviteSchema.parse(input);
  await requireOwnerOf(parsed.teamId, userId);

  const email = normaliseInviteEmail(parsed.email);
  if (!isPlausibleEmail(email)) throw new Error("That does not look like an email address.");

  const already = await queryOne<{ id: string }>(
    `select u.id from users u
       join team_members tm on tm.user_id = u.id and tm.team_id = $1
      where lower(u.email) = $2`,
    [parsed.teamId, email],
  );
  if (already) throw new Error("They are already in this team.");

  const token = mintInviteToken();

  const row = await queryOne<{ id: string; team_name: string }>(
    `with upserted as (
       insert into team_invites (team_id, email, token_hash, invited_by, expires_at)
       values ($1, $2, $3, $4, $5)
       on conflict (team_id, lower(email)) where accepted_at is null
       do update set token_hash = excluded.token_hash,
                     invited_by = excluded.invited_by,
                     expires_at = excluded.expires_at,
                     created_at = now()
       returning id, team_id
     )
     select upserted.id, t.name as team_name
       from upserted join teams t on t.id = upserted.team_id`,
    [parsed.teamId, email, hashInviteToken(token), userId, inviteExpiryFrom(new Date())],
  );

  if (!row) throw new Error("Could not create that invitation.");

  const inviter = await queryOne<{ name: string | null; email: string }>(
    "select name, email from users where id = $1",
    [userId],
  );

  const acceptUrl = `${appUrl()}/invite/${token}`;
  const sent = await sendInviteEmail({
    to: email,
    teamName: row.team_name,
    inviterName: inviter?.name || inviter?.email || "A colleague",
    acceptUrl,
  });

  revalidatePath(APP_ROUTES.team);
  return { acceptUrl, emailSent: sent.ok, emailError: sent.ok ? null : sent.reason };
}

const revokeSchema = z.object({ teamId: z.string().uuid(), inviteId: z.string().uuid() });

export async function revokeInvite(input: z.input<typeof revokeSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = revokeSchema.parse(input);
  await requireOwnerOf(parsed.teamId, userId);

  await queryOne("delete from team_invites where id = $1 and team_id = $2 returning id", [
    parsed.inviteId,
    parsed.teamId,
  ]);
  revalidatePath(APP_ROUTES.team);
}

const removeSchema = z.object({ teamId: z.string().uuid(), userId: z.string().uuid() });

export async function removeMember(input: z.input<typeof removeSchema>): Promise<void> {
  const actorId = await requireUserId();
  const parsed = removeSchema.parse(input);
  await requireOwnerOf(parsed.teamId, actorId);

  if (parsed.userId === actorId) {
    throw new Error("You cannot remove yourself from a team you own.");
  }

  await queryOne("delete from team_members where team_id = $1 and user_id = $2 returning user_id", [
    parsed.teamId,
    parsed.userId,
  ]);

  // Anyone pointed at the team they just left resolves to their personal team
  // on the next request; getActiveTeam handles the stale pointer.
  revalidatePath("/", "layout");
}

const switchSchema = z.object({ teamId: z.string().uuid() });

export async function switchTeam(input: z.input<typeof switchSchema>): Promise<void> {
  const userId = await requireUserId();
  const parsed = switchSchema.parse(input);

  const row = await queryOne(
    `update users set active_team_id = $2
      where id = $1
        and exists (select 1 from team_members where team_id = $2 and user_id = $1)
      returning id`,
    [userId, parsed.teamId],
  );

  if (!row) throw new Error("You are not a member of that team.");
  revalidatePath("/", "layout");
}

export type AcceptOutcome =
  | { ok: true; teamName: string }
  | { ok: false; reason: "unknown" | "expired" | "accepted" | "already-member" };

/**
 * Redeems an invitation for the signed-in user.
 *
 * The token is looked up by its hash — the plaintext is never stored — and the
 * accept is conditional on `accepted_at is null` in the same statement, so two
 * clicks on the same link cannot both succeed.
 */
export async function acceptInvite(token: string): Promise<AcceptOutcome> {
  const userId = await requireUserId();

  const invite = await queryOne<{
    id: string;
    team_id: string;
    team_name: string;
    expires_at: string;
    accepted_at: string | null;
  }>(
    `select i.id, i.team_id, t.name as team_name, i.expires_at, i.accepted_at
       from team_invites i join teams t on t.id = i.team_id
      where i.token_hash = $1`,
    [hashInviteToken(token)],
  );

  if (!invite) return { ok: false, reason: "unknown" };

  const state = inviteState(
    { expiresAt: invite.expires_at, acceptedAt: invite.accepted_at },
    new Date(),
  );
  if (state !== "usable") return { ok: false, reason: state };

  const member = await queryOne<{ user_id: string }>(
    "select user_id from team_members where team_id = $1 and user_id = $2",
    [invite.team_id, userId],
  );
  if (member) return { ok: false, reason: "already-member" };

  const client = await pool.connect();
  try {
    await client.query("begin");

    const claimed = await client.query(
      "update team_invites set accepted_at = now(), accepted_by = $2 where id = $1 and accepted_at is null returning id",
      [invite.id, userId],
    );

    if (claimed.rowCount === 0) {
      await client.query("rollback");
      return { ok: false, reason: "accepted" };
    }

    await client.query(
      "insert into team_members (team_id, user_id, role) values ($1, $2, 'member') on conflict do nothing",
      [invite.team_id, userId],
    );
    await client.query("update users set active_team_id = $2 where id = $1", [userId, invite.team_id]);

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/", "layout");
  return { ok: true, teamName: invite.team_name };
}
