"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/actions/auth";
import { switchTeam } from "@/actions/teams";
import type { TeamOption } from "@/lib/team-data";
import { ChevronIcon } from "@/components/ui/icons";
import { getInitials } from "@/lib/utils";

/**
 * The design's top bar shows only the instructor's name and avatar — no
 * log-out button. Signing out still has to be reachable, so it lives in a menu
 * behind the avatar rather than as a second button competing with "New Plan".
 */
export function UserMenu({
  instructorName,
  teams = [],
  activeTeamId,
}: {
  instructorName: string;
  teams?: TeamOption[];
  activeTeamId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="tp-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${instructorName}`}
        onClick={() => setOpen((value) => !value)}
        style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
      >
        <span className="tp-avatar-name">{instructorName}</span>
        <span className="av">{getInitials(instructorName)}</span>
        {/* Without this the trigger reads as a nameplate: the design's top bar
            shows only a name and an avatar, so there was nothing to say the
            menu — and with it, signing out — existed at all. */}
        <span style={{ opacity: 0.5, display: "inline-flex" }}>
          <ChevronIcon size={8} className={open ? "tp-chev open" : "tp-chev"} />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="tp-card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            padding: 6,
            minWidth: 160,
            boxShadow: "var(--shadow-lg)",
            zIndex: 60,
          }}
        >
          {teams.length > 1 ? (
            <>
              <div className="tp-eyebrow" style={{ padding: "6px 12px 4px" }}>
                Team
              </div>
              {teams.map((team) => (
                <form key={team.id} action={switchTeam.bind(null, { teamId: team.id })}>
                  <button
                    type="submit"
                    role="menuitem"
                    aria-current={team.id === activeTeamId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: team.id === activeTeamId ? "var(--accent-soft)" : "transparent",
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    <span>{team.name}</span>
                    {team.memberCount > 1 ? (
                      <span className="tp-tiny tp-mut tp-mono">{team.memberCount}</span>
                    ) : null}
                  </button>
                </form>
              ))}
              <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
            </>
          ) : null}

          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
