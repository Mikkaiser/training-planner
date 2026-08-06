import { removeMember, revokeInvite } from "@/actions/teams";
import { TopBar } from "@/components/layout/TopBar";
import { InviteButton } from "@/components/team/InviteButton";
import { NewTeamButton } from "@/components/team/NewTeamButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { getInstructorName } from "@/lib/plan-data";
import { getActiveTeam, getPendingInvites, getTeamMembers } from "@/lib/team-data";

export default async function TeamPage() {
  const [team, instructorName] = await Promise.all([getActiveTeam(), getInstructorName()]);
  const [members, invites] = await Promise.all([
    getTeamMembers(team.teamId),
    // Returns nothing for a member: open invitations are live credentials.
    getPendingInvites(team.teamId),
  ]);

  const isOwner = team.role === "owner";

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />

      <section className="tp-shell tp-page-section">
        <div className="tp-page-head">
          <div className="tp-col" style={{ gap: 4 }}>
            <div className="tp-eyebrow">{team.isPersonal ? "Your own plans" : "Team"}</div>
            <h1 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.03em" }}>{team.teamName}</h1>
          </div>
          <div className="tp-head-actions tp-row tp-gap-2">
            <NewTeamButton />
            {isOwner && !team.isPersonal ? <InviteButton teamId={team.teamId} /> : null}
          </div>
        </div>

        {team.isPersonal ? (
          <div
            className="tp-tiny tp-mut"
            style={{
              padding: "14px 16px",
              background: "var(--surface-2)",
              borderRadius: 12,
              border: "1px dashed var(--border-strong)",
              marginBottom: 20,
            }}
          >
            This is your own space — nobody else can see these plans. Make a team to work on a shared
            set with another trainer.
          </div>
        ) : null}

        <div className="tp-eyebrow" style={{ marginBottom: 10 }}>
          Members · {members.length}
        </div>
        <div className="tp-col tp-gap-2">
          {members.map((member) => (
            <div key={member.userId} className="tp-card tp-row" style={{ padding: "14px 16px", justifyContent: "space-between", gap: 12 }}>
              <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{member.name ?? member.email}</div>
                <div className="tp-tiny tp-mut">{member.email}</div>
              </div>
              <div className="tp-row tp-gap-3" style={{ alignItems: "center", flexShrink: 0 }}>
                <span className="tp-pill tp-pill-mono">{member.role}</span>
                {isOwner && member.userId !== team.userId ? (
                  <ConfirmButton
                    className="tp-btn tp-btn-ghost tp-btn-sm"
                    label="Remove"
                    ariaLabel={`Remove ${member.email}`}
                    title={`Remove ${member.name ?? member.email}?`}
                    body="They lose access to every plan in this team immediately. Plans they made stay with the team."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      "use server";
                      await removeMember({ teamId: team.teamId, userId: member.userId });
                    }}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {isOwner && invites.length > 0 ? (
          <>
            <div className="tp-eyebrow" style={{ margin: "26px 0 10px" }}>
              Invited · {invites.length}
            </div>
            <div className="tp-col tp-gap-2">
              {invites.map((invite) => (
                <div key={invite.id} className="tp-card tp-row" style={{ padding: "14px 16px", justifyContent: "space-between", gap: 12 }}>
                  <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{invite.email}</div>
                    <div className="tp-tiny tp-mut">Expires {new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                  <ConfirmButton
                    className="tp-btn tp-btn-ghost tp-btn-sm"
                    label="Withdraw"
                    ariaLabel={`Withdraw the invitation to ${invite.email}`}
                    title={`Withdraw the invitation to ${invite.email}?`}
                    body="The link they were sent stops working immediately."
                    confirmLabel="Withdraw"
                    onConfirm={async () => {
                      "use server";
                      await revokeInvite({ teamId: team.teamId, inviteId: invite.id });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
