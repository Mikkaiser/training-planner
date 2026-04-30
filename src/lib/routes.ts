export const APP_ROUTES = {
  home: "/",
  login: "/login",
  authCallback: "/auth/callback",
} as const;

export function planDetailRoute(planId: string): string {
  return `/plan/${planId}`;
}
