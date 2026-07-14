import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/Section";
import { EXPERIENCES } from "@/lib/mock-data";

const FILTERS = [
  "All",
  "Culture and Heritage",
  "Prayer and Reflection",
  "Purification and Realignment",
  "Divination",
  "Nature and Adventure",
  "Oríkì and Heritage",
];

export const Route = createFileRoute("/experiences/")({
  head: () => ({
    meta: [
      { title: "Experiences — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Cultural tours, prayer walks, purification, divination, workshops and heritage consultations.",
      },
    ],
  }),
  component: ExperiencesPage,
});

function ExperiencesPage() {
  const [active, setActive] = useState("All");
  const items = EXPERIENCES.filter((e) => active === "All" || e.category === active);

  return (
    <>
      <PageHero
        eyebrow="Experiences"
        title="Living encounters, gathered with care."
        intro="A catalogue of tours, walks, consultations and workshops. Details will be published following operational confirmation."
      />

      <section className="container-y py-16">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-full border px-4 py-2 text-xs transition ${
                active === f
                  ? "border-forest-deep bg-forest-deep text-ivory"
                  : "border-border text-foreground/75 hover:border-forest"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Link
              key={e.slug}
              to="/experiences/$slug"
              params={{ slug: e.slug }}
              className="group flex flex-col overflow-hidden border border-border bg-background transition hover:border-forest"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={e.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="eyebrow">{e.category}</p>
                <h3 className="mt-3 font-serif text-2xl text-forest-deep">{e.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{e.summary}</p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="text-muted-foreground">{e.duration}</span>
                  <span className="font-medium text-clay">View Details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
