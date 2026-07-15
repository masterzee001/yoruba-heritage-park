import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

import { getAdminAuthState, submitAdminLogin } from "@/admin/auth-functions";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : "/admin",
  }),
  loader: () => getAdminAuthState(),
  head: () => ({
    meta: [
      { title: "Administrator Login — Yoruba Heritage Park" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginRoute,
});

function AdminLoginRoute() {
  const auth = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(auth.previewMessage);
  const [submitting, setSubmitting] = useState(false);
  const disabled = auth.mode === "disabled";

  return (
    <main className="grid min-h-dvh place-items-center bg-[oklch(0.97_0.005_150)] px-4 py-10 text-charcoal">
      <section className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-forest-deep text-ivory">
            <LockKeyhole className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Administrator
            </p>
            <h1 className="font-serif text-2xl text-forest-deep">Secure access</h1>
          </div>
        </div>

        {message ? (
          <p className="mt-5 rounded-sm border border-brass/30 bg-brass/10 px-3 py-2 text-sm text-forest-deep">
            {message}
          </p>
        ) : null}

        <form
          className="mt-6 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            const result = await submitAdminLogin({
              data: { email, password, returnTo: search.returnTo },
            });
            setSubmitting(false);
            if (result.ok) {
              await navigate({
                to: search.returnTo.startsWith("/admin") ? search.returnTo : "/admin",
              });
            } else {
              setMessage(result.message);
            }
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Email address
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              disabled={disabled || submitting}
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              required
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Password
            <span className="flex rounded-sm border border-border bg-background focus-within:outline focus-within:outline-2 focus-within:outline-forest">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                disabled={disabled || submitting}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="grid size-10 place-items-center text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={disabled || submitting}
            className="rounded-sm bg-forest-deep px-4 py-2.5 text-sm font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Checking access" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
