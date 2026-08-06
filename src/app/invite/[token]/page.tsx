import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { acceptInvite } from "@/actions/teams";
import { Logo } from "@/components/layout/Logo";
import { queryOne } from "@/lib/db";
import { hashInviteToken, inviteState } from "@/lib/invite-token";
import { APP_ROUTES } from "@/lib/routes";

/**
 * Where an invitation link lands.
 *
 * Public — the middleware excludes `/invite` — because the person clicking it
 * has usually never signed in here. Signed out, it says who invited them and to
 * what, then sends them to Google and back to this same URL; the token would
 * otherwise be lost at the login redirect.
 */
export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams?: { accept?: string };
}) {
  const session = await auth();

  const invite = await queryOne<{
    team_name: string;
    inviter: string | null;
    email: string;
    expires_at: string;
    accepted_at: string | null;
  }>(
    `select t.name as team_name, u.name as inviter, i.email, i.expires_at, i.accepted_at
       from team_invites i
       join teams t on t.id = i.team_id
       left join users u on u.id = i.invited_by
      where i.token_hash = $1`,
    [hashInviteToken(params.token)],
  );

  if (!invite) return <Shell title="That invitation is not valid" body="The link may have been mistyped, or the invitation was withdrawn." />;

  const state = inviteState({ expiresAt: invite.expires_at, acceptedAt: invite.accepted_at }, new Date());

  if (state === "expired") {
    return <Shell title="That invitation has expired" body={`Ask whoever invited you to ${invite.team_name} to send a new one.`} />;
  }
  if (state === "accepted") {
    return <Shell title="That invitation has already been used" body="If it was you, sign in and switch teams from the account menu." signedIn={Boolean(session?.user?.id)} />;
  }

  if (!session?.user?.id) {
    return (
      <Shell
        title={`Join ${invite.team_name}`}
        body={`${invite.inviter ?? "A colleague"} invited ${invite.email}. Sign in to accept — you will be able to see and edit every plan in the team.`}
        action={
          <Link
            href={`${APP_ROUTES.login}?next=${encodeURIComponent(`/invite/${params.token}`)}`}
            className="tp-btn tp-btn-primary"
            style={{ width: "100%", padding: "12px 16px", justifyContent: "center" }}
          >
            Sign in to accept
          </Link>
        }
      />
    );
  }

  // Accepting is a state change, so it happens on a POST, not on the GET that
  // merely opened the link — otherwise a mail scanner prefetching the URL joins
  // the team on the recipient's behalf.
  async function accept() {
    "use server";
    const outcome = await acceptInvite(params.token);
    if (outcome.ok) redirect(APP_ROUTES.home);
    redirect(`/invite/${params.token}`);
  }

  return (
    <Shell
      title={`Join ${invite.team_name}`}
      body={`${invite.inviter ?? "A colleague"} invited you. Accepting gives you access to every training plan in this team.`}
      action={
        <form action={accept}>
          <button type="submit" className="tp-btn tp-btn-primary" style={{ width: "100%", padding: "12px 16px" }}>
            Accept and join
          </button>
        </form>
      }
    />
  );
}

function Shell({
  title,
  body,
  action,
  signedIn,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  signedIn?: boolean;
}) {
  return (
    <main className="tp-page" style={{ justifyContent: "center", alignItems: "center", padding: 24 }}>
      <section className="tp-card" style={{ width: "100%", maxWidth: 460, padding: 28, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: 18 }}>
          <Logo variant="lockup" size={30} />
        </div>
        <h1 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.03em" }}>{title}</h1>
        <p style={{ color: "var(--ink-2)", marginTop: 10, marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>{body}</p>
        {action ?? (
          <Link href={signedIn ? APP_ROUTES.home : APP_ROUTES.login} className="tp-btn tp-btn-ghost">
            {signedIn ? "Go to your plans" : "Sign in"}
          </Link>
        )}
      </section>
    </main>
  );
}
