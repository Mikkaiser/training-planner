import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
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
          <Link href={APP_ROUTES.home} aria-label="Training Planner — home">
            <Logo variant="lockup" />
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
          {/* The mark alone here: the back arrow already carries the "leave"
              affordance, and a full lockup would crowd the competitor's name,
              which is what this bar is actually for. */}
          <Link href={APP_ROUTES.home} aria-label="Training Planner — home" className="tp-brand-detail">
            <Logo variant="mark" size={22} />
          </Link>
          {titleSlot ?? (
            <div className="tp-col" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
              {subtitle ? <div className="tp-tiny tp-mut">{subtitle}</div> : null}
            </div>
          )}
          {/* The detail bar carried no nav at first, which left the roadmap a
              dead end: the only way to Assessments was to go back out to the
              plan list and notice the link there. */}
          <div className="tp-nav-detail">
            <MainNav />
          </div>
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
