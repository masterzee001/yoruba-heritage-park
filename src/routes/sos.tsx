import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, MapPin, Phone, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { projectStatus } from "@/config/project-status";
import { SOS_CATEGORIES } from "@/lib/mock-data";

type SOSState =
  | "ready"
  | "holding"
  | "permission"
  | "sending"
  | "received"
  | "onway"
  | "cancelled"
  | "failed";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Visitor SOS — Yoruba Heritage Park" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content:
          "Browser-based visitor safety simulation. Press and hold to see the not implemented SOS flow.",
      },
    ],
  }),
  component: SOSPage,
});

function SOSPage() {
  const [state, setState] = useState<SOSState>("ready");
  const [progress, setProgress] = useState(0);
  const [silent, setSilent] = useState(false);
  const [cat, setCat] = useState(SOS_CATEGORIES[0]);
  const [ticket, setTicket] = useState("");
  const [name, setName] = useState("");
  const timerRef = useRef<number | null>(null);
  const demoOnly = !projectStatus.sosLiveEnabled;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startHold = () => {
    setState("holding");
    setProgress(0);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 2500) * 100);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(timerRef.current!);
        setState("permission");
        window.setTimeout(() => setState("sending"), 900);
        window.setTimeout(() => setState("received"), 2000);
        window.setTimeout(() => setState("onway"), 3400);
      }
    }, 40);
  };

  const cancelHold = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (state === "holding") setState("ready");
    setProgress(0);
  };

  const cancelAlert = () => {
    setState("cancelled");
    setProgress(0);
  };

  const reset = () => {
    setState("ready");
    setProgress(0);
  };

  return (
    <section className="bg-charcoal text-ivory">
      <div className="container-y grid min-h-[100dvh] gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <ShieldAlert className="size-3.5" /> Visitor Safety
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold">
              Not implemented
            </div>
          </div>
          <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">Visitor SOS</h1>
          <p className="mt-4 max-w-md text-ivory/70">
            Visitor SOS is not implemented yet. This page shows the intended user flow as a
            simulation until the live service is approved.
          </p>
          {demoOnly ? (
            <div className="mt-6 max-w-xl rounded-sm border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
              Demo only: this interface does not contact park response, emergency services or any
              live monitoring team.
            </div>
          ) : null}

          <div className="mt-10 space-y-4 rounded-sm border border-ivory/10 bg-ivory/[0.03] p-6">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ivory/60">
                Ticket reference
              </span>
              <input
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="YHP-XXXX-XXXX"
                className="mt-1 w-full rounded-sm border border-ivory/15 bg-transparent px-3 py-2.5 text-sm text-ivory placeholder:text-ivory/30"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ivory/60">Visitor name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-sm border border-ivory/15 bg-transparent px-3 py-2.5 text-sm text-ivory"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ivory/60">
                Emergency category
              </span>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="mt-1 w-full rounded-sm border border-ivory/15 bg-charcoal px-3 py-2.5 text-sm text-ivory"
              >
                {SOS_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ivory/80">
              <input
                type="checkbox"
                checked={silent}
                onChange={(e) => setSilent(e.target.checked)}
              />
              Silent SOS (no sound or visible confirmation)
            </label>
            <div className="flex items-center gap-2 text-xs text-ivory/60">
              <MapPin className="size-3.5" /> GPS permission:{" "}
              {demoOnly ? "simulated in demo mode" : "requested on send"}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ivory/20 px-5 py-3 text-sm text-ivory/45"
            >
              <Phone className="size-4" /> Direct emergency call pending
            </button>
            <Link
              to="/"
              className="inline-flex rounded-full border border-ivory/20 px-5 py-3 text-sm text-ivory/70 hover:bg-ivory/5"
            >
              Cancel and return home
            </Link>
          </div>
        </div>

        {/* SOS control panel */}
        <div className="flex flex-col items-center justify-center rounded-sm border border-ivory/10 bg-ivory/[0.02] p-10">
          {(state === "ready" || state === "holding") && (
            <>
              <p className="text-xs uppercase tracking-widest text-ivory/60">
                {state === "ready" ? "Ready" : "Press and hold"}
              </p>
              <button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                aria-label="Press and hold to simulate an SOS alert"
                className="relative mt-6 grid size-56 place-items-center rounded-full bg-destructive text-ivory shadow-[0_0_0_12px_oklch(0.52_0.19_25/0.15)] transition active:scale-[0.98]"
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="oklch(1 0 0 / 0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="oklch(1 0 0)"
                    strokeWidth="4"
                    strokeDasharray={`${(progress / 100) * 289} 289`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="relative text-center">
                  <ShieldAlert className="mx-auto size-10" />
                  <p className="mt-2 font-serif text-2xl">SOS</p>
                  <p className="text-[10px] uppercase tracking-widest text-ivory/80">
                    {demoOnly ? "Demo hold 2.5s" : "Hold 2.5s"}
                  </p>
                </div>
              </button>
              <p className="mt-8 max-w-xs text-center text-xs text-ivory/60">
                {demoOnly
                  ? "Release to cancel. This simulation shows how the live alert flow will work."
                  : "Release to cancel. This will share your location and ticket reference with park response."}
              </p>
            </>
          )}

          {state === "permission" && (
            <StatusView
              icon={MapPin}
              title="Requesting location"
              body="Please allow location access to help responders find you."
              tone="warn"
            />
          )}
          {state === "sending" && (
            <StatusView
              icon={ShieldAlert}
              title="Alert sending"
              body="Contacting park response..."
              tone="warn"
              pulse
            />
          )}
          {state === "received" && (
            <StatusView
              icon={CheckCircle2}
              title="Alert received"
              body="Park response has acknowledged your alert."
              tone="ok"
            />
          )}
          {state === "onway" && (
            <>
              <StatusView
                icon={CheckCircle2}
                title="Help is on the way"
                body={`Category: ${cat}. Please stay where you are if it is safe to do so.`}
                tone="ok"
              />
              <button
                onClick={cancelAlert}
                className="mt-6 rounded-full border border-ivory/30 px-5 py-2.5 text-xs"
              >
                Cancel alert
              </button>
            </>
          )}
          {state === "cancelled" && (
            <StatusView
              icon={X}
              title="Alert cancelled"
              body="Park response has been informed the alert is no longer active."
              tone="warn"
              onReset={reset}
            />
          )}
          {state === "failed" && (
            <StatusView
              icon={AlertTriangle}
              title="Connection failed"
              body="Unable to reach park response. Please call directly."
              tone="warn"
              onReset={reset}
            />
          )}

          <button
            onClick={() => setState("failed")}
            className="mt-8 text-[11px] uppercase tracking-widest text-ivory/30 hover:text-ivory/60"
          >
            Test failed connection state
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusView({
  icon: Icon,
  title,
  body,
  tone,
  pulse,
  onReset,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: "ok" | "warn";
  pulse?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto grid size-24 place-items-center rounded-full ${
          tone === "ok" ? "bg-moss/25 text-ivory" : "bg-destructive/25 text-ivory"
        } ${pulse ? "animate-pulse" : ""}`}
      >
        <Icon className="size-10" />
      </div>
      <h2 className="mt-6 font-serif text-3xl">{title}</h2>
      <p className="mt-3 max-w-xs text-sm text-ivory/70">{body}</p>
      {onReset ? (
        <button
          onClick={onReset}
          className="mt-6 rounded-full border border-ivory/30 px-5 py-2.5 text-xs"
        >
          Return to ready
        </button>
      ) : null}
    </div>
  );
}
