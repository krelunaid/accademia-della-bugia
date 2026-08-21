import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Accademia della Bugia";

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-cream">
      <div className="max-w-md">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Pagina assente</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Questa pagina è una bugia</h1>
        <p className="mt-3 text-sm leading-relaxed text-cream/70">
          Non esiste, oppure esisteva e ha deciso di non farsi trovare.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center text-sm text-cream underline-offset-4 hover:underline"
        >
          Torna in piazza
        </Link>
      </div>
    </main>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "App dell'Accademia della Bugia: bacheca, sfide e Campionato. Da mettere sulla schermata Home di iPhone e Android.",
      },
      { name: "theme-color", content: "#14110E" },
      { name: "apple-mobile-web-app-title", content: "La Bugia" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&display=swap",
      },
    ],
  }),
  notFoundComponent: NotFound,
  component: () => (
    <html lang="it" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "#1e1914",
                border: "1px solid #3a3128",
                color: "#f4ede0",
                fontFamily: "Figtree, system-ui, sans-serif",
              },
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
