import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan Your Visit — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Opening hours, admission, directions, parking, accessibility and safety for your visit.",
      },
    ],
  }),
  component: PlanPage,
});

const cards = [
  { title: "Opening hours", body: "Details to be confirmed." },
  { title: "Admission", body: "General, guided, cultural and group rates. To be confirmed." },
  { title: "Directions", body: "Ogun State, Nigeria. Route details to be confirmed." },
  { title: "Parking", body: "On-site parking planned. Details to be confirmed." },
  {
    title: "Designated tour buses",
    body: "Booked shuttle transport from selected pick-up points.",
  },
  { title: "Accessibility", body: "Details of accessible routes and services to be confirmed." },
  { title: "Visitor safety", body: "Visible staff, clear signage and browser-based Visitor SOS." },
  { title: "Dress guidance", body: "Modest, comfortable attire suited to walking outdoors." },
  { title: "What to bring", body: "Water, comfortable footwear, a light head covering." },
  {
    title: "Visitor conduct",
    body: "Please respect sacred spaces, staff instructions and other visitors.",
  },
];

function PlanPage() {
  return (
    <>
      <PageHero
        eyebrow="Plan Your Visit"
        title="A considered visit begins here."
        intro="Everything you need to prepare. Details will be published following operational confirmation."
      />

      <section className="container-y py-16">
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="bg-background p-7">
              <p className="eyebrow">{c.title}</p>
              <p className="mt-3 font-serif text-lg text-forest-deep">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link to="/tickets" className="rounded-full bg-forest-deep px-6 py-3 text-sm text-ivory">
            View Ticket Details
          </Link>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full border border-forest-deep/20 px-6 py-3 text-sm text-forest-deep/50"
          >
            Ride booking pending
          </button>
          <Link to="/faq" className="rounded-full border border-border px-6 py-3 text-sm">
            Frequently Asked Questions
          </Link>
        </div>
      </section>
    </>
  );
}
