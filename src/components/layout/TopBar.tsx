import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { APP_ROUTES } from "@/lib/routes";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  instructorName: string;
  mode?: "list" | "detail";
  title?: string;
  subtitle?: string;
  progress?: number;
}

export function TopBar({ instructorName, mode = "list", title, subtitle, progress = 0 }: TopBarProps) {
  return (
    <header className="tp-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {mode === "detail" ? (
          <Link href={APP_ROUTES.home} className="tp-btn tp-btn-ghost tp-btn-sm" aria-label="Back to plans">
            <ArrowLeft size={14} />
          </Link>
        ) : null}

        <div className="tp-logo">
          {mode === "list" ? <div className="tp-logo-mark tp-mono">T</div> : null}
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontWeight: 700 }}>{mode === "list" ? "Training Planner" : title}</span>
            {subtitle ? (
              <span style={{ fontSize: "12px", color: "var(--ink-2)", fontWeight: 500 }}>{subtitle}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {mode === "detail" ? <div style={{ width: "220px" }}><ProgressBar value={progress} /></div> : null}
        <div className="tp-avatar">
          <span>{instructorName}</span>
          <div className="av">{getInitials(instructorName)}</div>
        </div>
      </div>
    </header>
  );
}
