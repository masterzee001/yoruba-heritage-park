import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/Section";
import { EVENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Yoruba Heritage Park" },
      {
        name: "description",
        content: "Daily tours, prayer walks, workshops and ceremonies. Sample event calendar.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const now = new Date();
  const month = now.toLocaleString("en", { month: "long", year: "numeric" });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="A calendar of gathering."
        intro="Sample schedule for prototype presentation. Final calendar to be confirmed."
      />

      <section className="container-y py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(["list", "calendar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full border px-4 py-2 text-xs capitalize ${
                  view === v ? "border-forest-deep bg-forest-deep text-ivory" : "border-border"
                }`}
              >
                {v} view
              </button>
            ))}
          </div>
          <div className="flex gap-2 text-xs">
            {["All", "Cultural", "Prayer", "Workshops", "Ceremonies"].map((c, i) => (
              <button
                key={c}
                className={`rounded-full border px-3 py-1.5 ${
                  i === 0 ? "border-clay text-clay" : "border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {view === "calendar" ? (
          <div className="mt-10 rounded-sm border border-border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl text-forest-deep">{month}</h3>
              <div className="flex gap-2 text-sm">
                <button className="rounded border border-border px-3 py-1">←</button>
                <button className="rounded border border-border px-3 py-1">→</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="bg-cream py-2 text-muted-foreground">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={"e" + i} className="bg-background py-6" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvent = day % 4 === 0 || day % 7 === 0;
                return (
                  <div key={day} className="min-h-[72px] bg-background p-2 text-left">
                    <span className="text-xs text-muted-foreground">{day}</span>
                    {hasEvent && (
                      <div className="mt-1 truncate rounded-sm bg-forest-deep/10 px-1.5 py-0.5 text-[10px] text-forest-deep">
                        Cultural Tour
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {EVENTS.map((e) => (
              <article key={e.slug} className="flex flex-col gap-4 bg-background p-7">
                <p className="eyebrow">{e.category}</p>
                <h3 className="font-serif text-2xl text-forest-deep">{e.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {e.date} · {e.time}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">{e.availability}</span>
                  <Link
                    to="/events/$slug"
                    params={{ slug: e.slug }}
                    className="text-xs font-medium text-clay"
                  >
                    View Event →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
