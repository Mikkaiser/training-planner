import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// The wordmark only. The lockup was drawn in Space Grotesk, and setting it in
// the app's own face would quietly make the logo something other than the one
// that was commissioned.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-brand",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://training-planner.mikkaiser.com";

export const metadata: Metadata = {
  // Needed for openGraph to resolve the image to an absolute URL; without it
  // Next warns and social scrapers get a relative path they cannot fetch.
  metadataBase: new URL(APP_URL),
  title: "Training Planner",
  description: "WorldSkills Software Development training planner",
  openGraph: {
    title: "Training Planner",
    description: "WorldSkills Software Development training planner",
    type: "website",
  },
};

// Explicit rather than relying on the framework default. maximumScale is left
// alone on purpose: capping it would stop people zooming the roadmap, which is
// dense by design and the main reason someone would pinch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Brand ink, so an installed app's status bar matches the icon it launched
  // from rather than defaulting to white.
  themeColor: "#1a1c16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
