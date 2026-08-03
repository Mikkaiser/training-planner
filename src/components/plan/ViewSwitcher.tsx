"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { VIEW_COOKIE_MAX_AGE, viewHref } from "@/lib/view-modes";

interface ViewSwitcherProps {
  /** Allowed values with their labels, in display order. */
  options: readonly { value: string; label: string }[];
  current: string;
  /** Cookie that remembers this choice for the next visit. */
  cookieName: string;
  label: string;
}

/**
 * Segmented control over ?view=. Rendered as links so each view has a real,
 * shareable URL and the control still works without JavaScript; the click
 * handler only writes the stickiness cookie.
 */
export function ViewSwitcher({ options, current, cookieName, label }: ViewSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const remember = (value: string) => {
    // Not HttpOnly on purpose: the client writes it. It is read back through
    // an allowlist, so a tampered value can only fall back to the default.
    document.cookie = `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=${VIEW_COOKIE_MAX_AGE}; SameSite=Lax`;
  };

  return (
    <div className="tp-seg" role="group" aria-label={label}>
      {options.map((option) => {
        const isCurrent = option.value === current;
        return (
          <Link
            key={option.value}
            href={viewHref(pathname, new URLSearchParams(searchParams.toString()), option.value)}
            replace
            scroll={false}
            className="tp-seg-item"
            aria-current={isCurrent}
            onClick={() => remember(option.value)}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
