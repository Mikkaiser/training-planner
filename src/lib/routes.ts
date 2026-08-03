export const APP_ROUTES = {
  home: "/",
  login: "/login",
} as const;

export function planDetailRoute(planId: string): string {
  return `/plan/${planId}`;
}
