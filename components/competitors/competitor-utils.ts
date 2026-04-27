export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatGateSummary(gatesPassed: number, plansCount: number): string {
  const gateLabel = gatesPassed === 1 ? "gate" : "gates";
  const planLabel = plansCount === 1 ? "plan" : "plans";
  return `${gatesPassed} ${gateLabel} passed across ${plansCount} ${planLabel}`;
}
