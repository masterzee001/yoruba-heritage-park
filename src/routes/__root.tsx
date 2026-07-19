import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import heroEntranceImg from "@/assets/hero-entrance.jpg";
import { MobileBottomBar } from "@/components/site/MobileBottomBar";
import { ObservabilityBootstrap } from "@/components/site/ObservabilityBootstrap";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  getObservabilityBootstrapData,
  serializeObservabilityBootstrapData,
} from "@/lib/observability";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Path unavailable</p>
        <h1 className="mt-4 font-serif text-5xl text-forest-deep">Not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This page has not yet been created or the pathway has moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-forest-deep px-5 py-2.5 text-sm text-ivory"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-forest-deep">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-forest-deep px-5 py-2.5 text-sm text-ivory"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Yorùbá Heritage Park — Enter a Living Yorùbá World" },
      {
        name: "description",
        content:
          "A premium Yorùbá cultural, spiritual and nature destination in Ogun State, Nigeria.",
      },
      { name: "author", content: "Yoruba Heritage Park" },
      { property: "og:title", content: "Yorùbá Heritage Park — Enter a Living Yorùbá World" },
      {
        property: "og:description",
        content:
          "A premium Yorùbá cultural, spiritual and nature destination in Ogun State, Nigeria.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Yoruba Heritage Park" },
      { property: "og:image", content: heroEntranceImg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Yorùbá Heritage Park — Enter a Living Yorùbá World" },
      {
        name: "twitter:description",
        content:
          "A premium Yorùbá cultural, spiritual and nature destination in Ogun State, Nigeria.",
      },
      { name: "twitter:image", content: heroEntranceImg },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/brand/yhp-favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const observability = getObservabilityBootstrapData();

  return (
    <html lang="en">
      <head>
        <HeadContent />
        {observability ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__YHP_OBSERVABILITY__ = ${serializeObservabilityBootstrapData(observability)};`,
            }}
          />
        ) : null}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname === "/staff-access";

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : (
        <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
          <SiteHeader />
          <main id="main" className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
          <MobileBottomBar />
          <ObservabilityBootstrap pathname={pathname} />
        </div>
      )}
    </QueryClientProvider>
  );
}
