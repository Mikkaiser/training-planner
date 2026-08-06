export const APP_ROUTES = {
  home: "/",
  login: "/login",
  assessments: "/assessments",
  team: "/team",
} as const;

export function inviteRoute(token: string): string {
  return `/invite/${token}`;
}

export function planDetailRoute(planId: string): string {
  return `/plan/${planId}`;
}

export function assessmentSchemeRoute(schemeId: string): string {
  return `/assessments/${schemeId}`;
}

export function assessmentRunRoute(runId: string): string {
  return `/assessments/runs/${runId}`;
}
