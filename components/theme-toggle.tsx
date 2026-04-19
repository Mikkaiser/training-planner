"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === "light") {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("tp-theme", "light");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("tp-theme", "dark");
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
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
