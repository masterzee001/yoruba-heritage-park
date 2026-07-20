import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin, ShieldAlert } from "lucide-react";

import { projectStatus } from "@/config/project-status";
import { SOS_CATEGORIES } from "@/lib/mock-data";

type DemoState = "ready" | "holding" | "location-explanation" | "complete";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS Demonstration — Yoruba Heritage Park" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "A non-operational demonstration of the proposed visitor SOS experience.",
      },
    ],
  }),
  component: SosDemonstrationPage,
});

function SosDemonstrationPage() {
  const [state, setState] = useState<DemoState>("ready");
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState(SOS_CATEGORIES[0]);
  const timerRef = useRef<number | null>(null);

  const liveCapabilitiesDisabled =
    !projectStatus.sosLiveEnabled &&
    !projectStatus.geolocationLiveEnabled &&
    !projectStatus.sosNotificationsEnabled;

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  const stopTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startHold = () => {
    if (!liveCapabilitiesDisabled || state !== "ready") return;
    setState("holding");
    setProgress(0);
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const next = Math.min(100, ((Date.now() - startedAt) / 2500) * 100);
      setProgress(next);
      if (next >= 100) {
        stopTimer();
        setState("location-explanation");
      }
    }, 40);
  };

  const cancelHold = () => {
    if (state !== "holding") return;
    stopTimer();
    setProgress(0);
    setState("ready");
  };

  return (
    <section className="bg-charcoal text-ivory">
      <div className="container-y grid min-h-[100dvh] gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            <ShieldAlert className="size-3.5" /> Non-operational demonstration
          </div>
          <h1 className="mt-6 font-serif text-4xl leading-tight md:text-6xl">
            Visitor SOS demonstration
          </h1>
          <div className="mt-6 max-w-xl rounded-sm border-2 border-gold bg-gold/10 p-5 text-base font-semibold text-gold">
            Demonstration only. Emergency alert transmission is not currently active.
          </div>
          <p className="mt-5 max-w-xl text-ivory/75">
            This demonstration does not send an alert, contact park staff or emergency services,
            create an incident, request live location, or store any personal information.
          </p>

          <label className="mt-10 block max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-ivory/65">
              Demonstration category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full rounded-sm border border-ivory/20 bg-charcoal px-3 py-3 text-sm text-ivory"
            >
              {SOS_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="mt-6 flex items-start gap-3 rounded-sm border border-ivory/15 bg-ivory/[0.03] p-4 text-sm text-ivory/70">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
            <p>
              A future approved live system would ask for location permission at this point. This
              demonstration does not request, capture or store GPS coordinates.
            </p>
          </div>

          <Link
            to="/"
            className="mt-7 inline-flex rounded-full border border-ivory/20 px-5 py-3 text-sm text-ivory/75 hover:bg-ivory/5"
          >
            Return home
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center rounded-sm border border-ivory/10 bg-ivory/[0.02] p-8 md:p-10">
          {(state === "ready" || state === "holding") && (
            <>
              <p className="text-xs uppercase tracking-widest text-ivory/60">
                {state === "holding"
                  ? "Keep holding to continue the demonstration"
                  : "Press and hold"}
              </p>
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                aria-label="Press and hold to continue the SOS demonstration"
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
                <span className="relative text-center">
                  <ShieldAlert className="mx-auto size-10" />
                  <span className="mt-2 block font-serif text-2xl">SOS demo</span>
                  <span className="text-[10px] uppercase tracking-widest text-ivory/80">
                    Hold 2.5s
                  </span>
                </span>
              </button>
              <p className="mt-8 max-w-xs text-center text-xs text-ivory/60">
                Release early to cancel. Holding does not transmit anything.
              </p>
            </>
          )}

          {state === "location-explanation" && (
            <DemoStatus
              icon={MapPin}
              title="Future permission step"
              body="In a future approved system, the visitor would be asked whether to share their location. No permission was requested in this demonstration."
              action="Show simulated confirmation"
              onAction={() => setState("complete")}
            />
          )}

          {state === "complete" && (
            <DemoStatus
              icon={CheckCircle2}
              title="Demonstration complete"
              body={`Selected category: ${category}. No alert was sent, no location was captured, and no incident record was created.`}
              action="Restart demonstration"
              onAction={() => {
                setProgress(0);
                setState("ready");
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function DemoStatus({
  icon: Icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-gold/15 text-gold">
        <Icon className="size-10" />
      </div>
      <h2 className="mt-6 font-serif text-3xl">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory/70">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-full border border-gold/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold"
      >
        {action}
      </button>
    </div>
  );
}
