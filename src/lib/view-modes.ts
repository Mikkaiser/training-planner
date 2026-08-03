/**
 * Which presentation of the data the user is looking at.
 *
 * The URL is the source of truth so a view is reloadable and shareable; a
 * cookie remembers the last choice so returning to the app keeps it. A cookie
 * rather than localStorage because the server renders these pages — reading
 * localStorage would mean rendering the default first and correcting it after
 * hydration, which flashes.
 *
 * Both values are user-controlled input, so everything here goes through an
 * allowlist. A raw view string must never reach a class name or a path.
 */
export const LIST_VIEWS = ["cards", "table"] as const;
export const DETAIL_VIEWS = ["timeline", "tree", "route"] as const;

export type ListView = (typeof LIST_VIEWS)[number];
export type DetailView = (typeof DETAIL_VIEWS)[number];

export const DEFAULT_LIST_VIEW: ListView = "cards";
export const DEFAULT_DETAIL_VIEW: DetailView = "timeline";

export const VIEW_PARAM = "view";
export const LIST_VIEW_COOKIE = "tp_view_list";
export const DETAIL_VIEW_COOKIE = "tp_view_detail";

/** One year; it is a display preference and carries no security weight. */
export const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LIST_VIEW_LABELS: Record<ListView, string> = {
  cards: "Cards",
  table: "Table",
};

export const DETAIL_VIEW_LABELS: Record<DetailView, string> = {
  timeline: "Timeline",
  tree: "Tree",
  route: "Route",
};

function parse<T extends string>(allowed: readonly T[], fallback: T, raw?: string | string[]): T {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseListView(raw?: string | string[], cookie?: string): ListView {
  // An explicit ?view= always wins; the cookie only fills the gap.
  if (raw !== undefined) return parse(LIST_VIEWS, DEFAULT_LIST_VIEW, raw);
  return parse(LIST_VIEWS, DEFAULT_LIST_VIEW, cookie);
}

export function parseDetailView(raw?: string | string[], cookie?: string): DetailView {
  if (raw !== undefined) return parse(DETAIL_VIEWS, DEFAULT_DETAIL_VIEW, raw);
  return parse(DETAIL_VIEWS, DEFAULT_DETAIL_VIEW, cookie);
}

/** Preserves any other query params (search, filters) when switching views. */
export function viewHref(pathname: string, params: URLSearchParams, view: string): string {
  const next = new URLSearchParams(params);
  next.set(VIEW_PARAM, view);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
