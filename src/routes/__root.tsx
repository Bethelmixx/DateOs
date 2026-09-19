import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Providers } from "@/components/providers";
import { isLocalMode } from "@/lib/env";
import appCss from "../styles.css?url";

const APP_NAME = "DateOs";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    const localMode = isLocalMode();
    if (localMode) return { sessionUser: null, configError: null as string | null, localMode: true };
    try {
      return {
        sessionUser: await fetchSessionUser(),
        configError: null as string | null,
        localMode: false,
      };
    } catch (err) {
      console.error("[root] session load failed", err);
      const message = err instanceof Error ? err.message : "Error de servidor";
      return {
        sessionUser: null,
        configError: `No se pudo conectar. ${message}. Revisa DATABASE_URL (Neon pooled, host con -pooler).`,
        localMode: false,
      };
    }
  },
  errorComponent: RootError,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Reportes comunitarios en tiempo real sobre problemas en Venezuela.",
      },
      { name: "theme-color", content: "#0B1014" },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content: "Reportes comunitarios en tiempo real sobre problemas en Venezuela.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const { localMode } = Route.useRouteContext();
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__DATEOS_LOCAL__=${localMode ? "true" : "false"};`,
          }}
        />
      </head>
      <body className="bg-bg text-fg">
        <AuthProvider>
          <Providers>
            <Outlet />
          </Providers>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Error de servidor";
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DateOs</title>
      </head>
      <body style={{ background: "#0B1014", color: "#F3EEE4", fontFamily: "sans-serif", padding: 24 }}>
        <p style={{ fontWeight: 700 }}>DateOs no pudo arrancar</p>
        <p style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>{message}</p>
        <p style={{ marginTop: 16, opacity: 0.7, fontSize: 13 }}>
          En Vercel configura DATABASE_URL (Neon pooler), BETTER_AUTH_SECRET y BETTER_AUTH_URL, y
          vuelve a desplegar.
        </p>
      </body>
    </html>
  );
}

