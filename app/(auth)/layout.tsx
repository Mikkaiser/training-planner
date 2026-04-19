import { AuthFooter } from "@/components/layout/auth-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="relative z-[1] flex flex-1 flex-col justify-center px-6 py-10">
        {children}
      </div>
      <AuthFooter />
    </div>
  );
}
