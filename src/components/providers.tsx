import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 8_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "#141a21",
            color: "#f3eee4",
            border: "1px solid rgb(243 238 228 / 12%)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
