import type { Metadata } from "next";
import "./globals.css";
import { BackgroundVariantProvider } from "@/components/background/background-variant-context";
import { fontComfortaa, fontPoppins } from "@/lib/fonts";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Training Planner",
  description: "WorldSkills Software Development training plans, visualized.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Training Planner",
    statusBarStyle: "black-translucent",
  },
};

const themeInitScript = `
(function(){try{var t=localStorage.getItem('tp-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontComfortaa.variable} ${fontPoppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${fontComfortaa.className} flex min-h-full flex-col bg-transparent text-foreground`}
      >
        <BackgroundVariantProvider>
          <div className="app-content-layer flex min-h-full flex-1 flex-col">
            <Providers>{children}</Providers>
          </div>
        </BackgroundVariantProvider>
      </body>
    </html>
  );
}
