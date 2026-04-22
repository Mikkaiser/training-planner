"use client";

import { Label } from "@/components/ui/label";

const SWATCHES = [
  "var(--avatar-swatch-1)",
  "var(--avatar-swatch-2)",
  "var(--avatar-swatch-3)",
  "var(--avatar-swatch-4)",
  "var(--avatar-swatch-5)",
  "var(--avatar-swatch-6)",
] as const;

type Swatch = (typeof SWATCHES)[number];

type CompetitorAvatarSwatchPickerProps = {
  value: Swatch;
  onChange: (next: Swatch) => void;
};

export function CompetitorAvatarSwatchPicker({
  value,
  onChange,
}: CompetitorAvatarSwatchPickerProps): React.JSX.Element {
  return (
    <div>
      <Label className="tp-plan-label">Avatar color</Label>
      <div className="plan-add-competitor-form__swatches">
        {SWATCHES.map((c) => {
          const active = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="plan-add-competitor-form__swatch"
              data-active={active ? "true" : undefined}
              style={{ background: c }}
              aria-label={`Pick ${c}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export { SWATCHES };
export type { Swatch as CompetitorAvatarSwatch };

