"use client";

import * as React from "react";

export default function PhasesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="p-6">
      <div className="glass rounded-xl border border-border p-5">
        <div className="text-lg font-semibold text-tp-primary">Phases failed to load</div>
        <div className="mt-2 text-sm text-tp-secondary">Please try again.</div>
        <button type="button" onClick={reset} className="tp-plan-save-btn mt-4">
          Retry
        </button>
        <pre className="sr-only">{error.digest ?? error.message}</pre>
      </div>
    </div>
  );
}

