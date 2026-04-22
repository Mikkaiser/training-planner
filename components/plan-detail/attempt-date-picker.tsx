"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

type AttemptDatePickerProps = {
  value: string;
  onChange: (next: string) => void;
};

export function AttemptDatePicker({
  value,
  onChange,
}: AttemptDatePickerProps): React.JSX.Element {
  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(
    selected ? startOfMonth(selected) : startOfMonth(new Date())
  );

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);

  // Start the grid on Monday.
  const startDay = (start.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const gridStart = addDays(start, -startDay);

  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const displayValue = selected ? format(selected, "dd/MM/yyyy") : "";

  return (
    <Popover>
      <PopoverTrigger
        className="glass-input plan-attempt-form__date-btn"
        role="button"
        aria-label="Pick date"
      >
        <span className={displayValue ? "" : "plan-attempt-form__date-placeholder"}>
          {displayValue || "Select a date"}
        </span>
        <span className="plan-attempt-form__date-icon" aria-hidden>
          <Calendar size={16} />
        </span>
      </PopoverTrigger>

      <PopoverContent className="plan-attempt-form__date-popover">
        <div className="plan-attempt-form__date-head">
          <button
            type="button"
            className="plan-attempt-form__date-nav hover-tint"
            onClick={() => setViewMonth((m) => startOfMonth(subMonths(m, 1)))}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="plan-attempt-form__date-title">{format(viewMonth, "MMMM yyyy")}</div>
          <button
            type="button"
            className="plan-attempt-form__date-nav hover-tint"
            onClick={() => setViewMonth((m) => startOfMonth(addMonths(m, 1)))}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="plan-attempt-form__date-weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="plan-attempt-form__date-weekday">
              {d}
            </div>
          ))}
        </div>

        <div className="plan-attempt-form__date-grid">
          {days.map((day) => {
            const isOutside = day < start || day > end;
            const dayKey = format(day, "yyyy-MM-dd");
            const isSelected = value === dayKey;
            const isToday = dayKey === format(new Date(), "yyyy-MM-dd");

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onChange(dayKey)}
                className="plan-attempt-form__date-day"
                data-outside={isOutside ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
                data-today={isToday ? "true" : undefined}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

