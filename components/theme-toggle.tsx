"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === "dark") {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("tp-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("tp-theme", "light");
    }
    setTheme(next);
  }, []);

  function toggle() {
    applyTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="border-border bg-transparent text-tp-primary"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      {theme === "light" ? (
        <Sun className="h-[25px] w-[25px]" />
      ) : (
        <Moon className="h-[25px] w-[25px]" />
      )}
    </Button>
  );
}
