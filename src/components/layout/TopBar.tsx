import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";
import { BackArrowIcon } from "@/components/ui/icons";
import { APP_ROUTES } from "@/lib/routes";

interface TopBarProps {
  instructorName: string;
  mode?: "list" | "detail";
  title?: string;
  subtitle?: string;
  progress?: number;
  /** Slot before the avatar — the detail page puts its view switcher here. */
  children?: React.ReactNode;
}

export function TopBar({ instructorName, mode = "list", title, subtitle, progress = 0, children }: TopBarProps) {
  return (
    <header className="tp-topbar">
      {mode === "list" ? (
        <div className="tp-logo">
          <div className="tp-logo-mark tp-mono">T</div>
          <span>Training Planner</span>
        </div>
      ) : (
        <div className="tp-row tp-gap-3">
          <Link
            href={APP_ROUTES.home}
            className="tp-btn tp-btn-ghost tp-btn-sm"
            style={{ padding: "6px 8px" }}
            aria-label="Back to plans"
          >
            <BackArrowIcon size={12} />
          </Link>
          <div className="tp-col" style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
            {subtitle ? <div className="tp-tiny tp-mut">{subtitle}</div> : null}
          </div>
        </div>
      )}

      <div className="tp-row tp-gap-4">
        {mode === "detail" ? (
          <div className="tp-row tp-gap-2" style={{ width: 220 }}>
            <div className="tp-bar" style={{ flex: 1 }}>
              <i style={{ width: `${progress}%` }} />
            </div>
            <div className="tp-tiny tp-mono tp-mut">{progress}%</div>
          </div>
        ) : null}

        {children}

        <UserMenu instructorName={instructorName} />
      </div>
    </header>
  );
}
