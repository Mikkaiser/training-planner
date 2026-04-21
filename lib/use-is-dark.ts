"use client";

import { useEffect, useState } from "react";

/**
 * Read the current theme state (`data-theme="dark"` on <html>) and keep it
 * in sync with theme toggles. Components that need to select theme-aware
 * palette tokens (subcompetence colors etc.) use this hook.
 *
 * Color decisions that don't need palette variants should use CSS variables
 * directly — dark mode is handled globally in globals.css.
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const read = () => setIsDark(root.getAttribute("data-theme") === "dark");
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
