import Link from "next/link";
import { MainNav } from "@/components/layout/MainNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { BackArrowIcon } from "@/components/ui/icons";
import { APP_ROUTES } from "@/lib/routes";

interface TopBarProps {
  instructorName: string;
  mode?: "list" | "detail";
  title?: string;
  subtitle?: string;
  progress?: number;
  /** Replaces the static title/subtitle, so the detail page can make them editable. */
  titleSlot?: React.ReactNode;
  /** Slot before the avatar — the detail page puts its view switcher here. */
  children?: React.ReactNode;
}

export function TopBar({
  instructorName,
  mode = "list",
  title,
  subtitle,
  progress = 0,
  titleSlot,
  children,
}: TopBarProps) {
  return (
    <header className="tp-topbar">
      {mode === "list" ? (
        <div className="tp-row tp-gap-4" style={{ minWidth: 0 }}>
          <Link href={APP_ROUTES.home} className="tp-logo">
            <div className="tp-logo-mark tp-mono">T</div>
            <span>Training Planner</span>
          </Link>
          <MainNav />
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
          {titleSlot ?? (
            <div className="tp-col" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
              {subtitle ? <div className="tp-tiny tp-mut">{subtitle}</div> : null}
            </div>
          )}
        </div>
      )}

      <div className="tp-row tp-gap-4">
        {mode === "detail" ? (
          <div className="tp-row tp-gap-2 tp-progress-inline">
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
