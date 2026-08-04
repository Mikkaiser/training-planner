"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes";

const LINKS = [
  { href: APP_ROUTES.home, label: "Plans" },
  { href: APP_ROUTES.assessments, label: "Assessments" },
] as const;

/**
 * The app's two top-level areas. Deliberately quiet — the design has only one
 * screen family and draws no nav, so this reads as a label strip rather than a
 * second set of buttons competing with the primary action.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="tp-nav" aria-label="Sections">
      {LINKS.map((link) => {
        // "/" would otherwise match every path, so the home link needs an exact
        // test while the others match their whole subtree.
        const isCurrent =
          link.href === APP_ROUTES.home
            ? pathname === "/" || pathname.startsWith("/plan")
            : pathname.startsWith(link.href);

        return (
          <Link key={link.href} href={link.href} className="tp-nav-link" aria-current={isCurrent ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
