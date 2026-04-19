"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="system"
        richColors
        toastOptions={{
          className: "glass-strong rounded-xl text-tp-primary",
        }}
      />
    </QueryClientProvider>
  );
}

