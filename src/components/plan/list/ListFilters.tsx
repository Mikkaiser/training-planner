"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";

interface ListFiltersProps {
  phases: string[];
}

/**
 * Search and filters live in the URL so the table view is shareable and the
 * filtering happens on the server, where the data already is. router.replace
 * rather than push, so typing does not fill the back button with keystrokes.
 */
export function ListFilters({ phases }: ListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const isFirstRender = useRef(true);

  const apply = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  useEffect(() => {
    // Skip the mount pass, otherwise landing on the page immediately rewrites
    // the URL and clobbers a shared link's own query.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      apply((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const select = (name: string, value: string) =>
    apply((params) => {
      if (value) params.set(name, value);
      else params.delete(name);
    });

  return (
    <div className="tp-row tp-gap-2" style={{ flexWrap: "wrap" }}>
      <label
        className="tp-row tp-gap-2 tp-field"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 12,
          color: "var(--ink-2)",
        }}
      >
        <SearchIcon size={12} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search competitors and plans"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            font: "inherit",
            color: "var(--ink)",
            width: 130,
          }}
        />
      </label>

      <select
        className="tp-btn tp-btn-ghost tp-btn-sm"
        aria-label="Filter by phase"
        value={searchParams.get("phase") ?? ""}
        onChange={(event) => select("phase", event.target.value)}
      >
        <option value="">All phases</option>
        {phases.map((phase) => (
          <option key={phase} value={phase}>
            {phase}
          </option>
        ))}
      </select>

      <select
        className="tp-btn tp-btn-ghost tp-btn-sm"
        aria-label="Filter by gate status"
        value={searchParams.get("gate") ?? ""}
        onChange={(event) => select("gate", event.target.value)}
      >
        <option value="">All gates</option>
        <option value="pending">Pending</option>
        <option value="passed">Passed</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
}
