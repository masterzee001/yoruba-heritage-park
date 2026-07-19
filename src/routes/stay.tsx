import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";
import { HUTS } from "@/lib/mock-data";
import stayImg from "@/assets/stay-hut.jpg";

export const Route = createFileRoute("/stay")({
  head: () => ({
    meta: [
      { title: "Stay and Own — Yoruba Heritage Park" },
      {
        name: "description",
        content: "A quiet collection of vacation huts, held within the forest. Enquiry only.",
      },
    ],
  }),
  component: StayPage,
});

function StayPage() {
  return (
    <>
      <PageHero
        eyebrow="Stay and Own"
        title="A quiet home within the forest."
        intro="A limited collection of vacation huts. Ownership and inspection by enquiry."
        image={stayImg}
      />

      <section className="container-y py-20">
        <p className="eyebrow">Hut models</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {HUTS.map((h) => (
            <article
              key={h.slug}
              className="flex flex-col overflow-hidden border border-border bg-background"
            >
              <img
                src={stayImg}
                alt={`${h.name} vacation hut in a forest setting.`}
                loading="lazy"
                className="aspect-[4/3] size-full object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <p className="eyebrow">{h.setting}</p>
                <h3 className="mt-3 font-serif text-2xl text-forest-deep">{h.name}</h3>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {h.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full bg-forest-deep px-4 py-2 text-xs text-ivory opacity-70"
                  >
                    Request Information
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full border border-border px-4 py-2 text-xs opacity-70"
                  >
                    Book an Inspection
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-sm border border-border bg-cream p-8">
          <p className="eyebrow">Please note</p>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Final pricing, availability and legal details are subject to confirmation. Online
            property purchase is not available.
          </p>
        </div>
      </section>
    </>
  );
}
