import { AuthFooter } from "@/components/layout/auth-footer";
import BackgroundBlobs from "@/components/layout/BackgroundBlobs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <BackgroundBlobs />
      <main style={{ flex: 1, position: "relative", zIndex: 1, overflowY: "auto" }}>
        <div className="flex min-h-[100dvh] flex-col">
          <div className="relative z-[1] flex flex-1 flex-col justify-center px-6 py-10">
            {children}
          </div>
          <AuthFooter />
        </div>
      </main>
    </div>
  );
}
