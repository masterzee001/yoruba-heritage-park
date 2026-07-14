import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";

const kinds = [
  "Weddings",
  "Naming ceremonies",
  "Baptisms",
  "Private prayer",
  "Purification",
  "Family occasions",
  "Cultural gatherings",
  "Organisational retreats",
];

export const Route = createFileRoute("/ceremonies")({
  head: () => ({
    meta: [
      { title: "Ceremonies and Private Occasions — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Weddings, naming ceremonies, private prayer, purification and organisational retreats.",
      },
    ],
  }),
  component: CeremoniesPage,
});

function CeremoniesPage() {
  return (
    <>
      <PageHero
        eyebrow="Ceremonies"
        title="Occasions held with dignity."
        intro="Spaces and support for ceremonies and gatherings. Enquiry based — no instant checkout."
      />

      <section className="container-y grid gap-14 py-20 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div>
          <p className="eyebrow">Occasion types</p>
          <ul className="mt-6 space-y-3">
            {kinds.map((k) => (
              <li
                key={k}
                className="border-t border-border pt-4 font-serif text-xl text-forest-deep"
              >
                {k}
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit border border-border bg-cream p-8">
          <p className="eyebrow">Ceremony enquiry</p>
          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm">Occasion type</span>
              <select className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm">
                {kinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            {[
              { l: "Preferred date", t: "date" },
              { l: "Expected guests", t: "number" },
              { l: "Contact name", t: "text" },
              { l: "Email", t: "email" },
              { l: "Phone", t: "tel" },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="text-sm">{f.l}</span>
                <input
                  type={f.t}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm">Notes</span>
              <textarea
                rows={4}
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <button className="w-full rounded-full bg-forest-deep px-5 py-3 text-sm text-ivory">
              Submit Enquiry
            </button>
            <p className="text-xs text-muted-foreground">
              Enquiry delivery will be enabled following operational confirmation.
            </p>
          </form>
        </aside>
      </section>
    </>
  );
}
