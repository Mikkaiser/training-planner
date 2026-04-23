"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { getSubcompetenceTokens } from "@/lib/constants/subcompetence-tokens";
import type { Subcompetence } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { useIsDark } from "@/lib/use-is-dark";

type SubcompetenceDropdownProps = {
  id?: string;
  options: Subcompetence[];
  value: string | null;
  placeholder?: string;
  onChange: (value: string | null) => void;
};

export function SubcompetenceDropdown({
  id,
  options,
  value,
  placeholder = "Select macro-competence",
  onChange,
}: SubcompetenceDropdownProps): React.JSX.Element {
  const isDark = useIsDark();
  const selected = options.find((option) => option.id === value) ?? null;

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        id={id}
        className="glass-input flex min-h-[46px] w-full items-center justify-between gap-2 rounded-lg px-3 text-[15px] text-tp-primary"
      >
        {selected ? (
          <span className="subcompetence-chip inline-flex max-w-full items-center gap-2 px-2 py-1 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: getSubcompetenceTokens(selected.color, isDark).color }}
              aria-hidden
            />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-tp-muted">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-tp-muted" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align="start" className="z-[260] outline-none">
          <PopoverPrimitive.Popup className="glass-panel--strong w-[var(--anchor-width)] rounded-xl border border-border p-1 text-tp-primary shadow-glow outline-none">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-tp-muted">No subcompetences selected.</div>
            ) : (
              options.map((option) => {
                const selectedOption = option.id === value;
                const optionTokens = getSubcompetenceTokens(option.color, isDark);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange(option.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors",
                      selectedOption ? "" : "hover:bg-[var(--hover-tint-bg)]",
                    )}
                    style={
                      selectedOption
                        ? {
                            ["--sc-color" as string]: optionTokens.color,
                            background:
                              "color-mix(in srgb, var(--sc-color, var(--color-accent)) 12%, transparent)",
                          }
                        : undefined
                    }
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: optionTokens.color }}
                      aria-hidden
                    />
                    <span className="truncate">{option.name}</span>
                    {selectedOption ? (
                      <Check className="ml-auto h-4 w-4 text-[var(--color-text-primary)]" />
                    ) : null}
                  </button>
                );
              })
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
