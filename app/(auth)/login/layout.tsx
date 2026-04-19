import { BackgroundBlobs } from "@/components/background/background-blobs";

/**
 * `/login` uses the `"login"` blob composition. The visible layer is rendered by
 * `RouteBackgroundBlobs` in the root shell (see `resolveAppBlobVariant`); this
 * file imports `BackgroundBlobs` so the route stays explicitly tied to that component.
 */
export type LoginRouteUsesBackgroundBlobs = typeof BackgroundBlobs;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
