import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Training Planner",
  description: "WorldSkills Software Development training planner",
};

// Explicit rather than relying on the framework default. maximumScale is left
// alone on purpose: capping it would stop people zooming the roadmap, which is
// dense by design and the main reason someone would pinch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>{children}</body>
    </html>
  );
}
