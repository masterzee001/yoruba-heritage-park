import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHead } from "@/components/site/Section";
import cultureImg from "@/assets/culture-architecture.jpg";
import waterImg from "@/assets/water-reflection.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Vision, cultural purpose, heritage preservation and custodianship at Yoruba Heritage Park, Ogun State.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Bigger Than Africa"
        intro="A living Yorùbá experience with meaning for the world."
        image={cultureImg}
      />

      <section className="container-y py-24">
        <div className="grid gap-16 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Vision</p>
            <h2 className="mt-3 font-serif text-3xl text-forest-deep md:text-4xl">
              To preserve, to present, to celebrate.
            </h2>
          </div>
          <p className="text-lg leading-[1.8] text-foreground/80">
            Yoruba Heritage Park is a cultural, spiritual, educational, nature and tourism
            destination created to give the Yorùbá heritage a home where it can be lived, studied
            and shared with the world. It is rooted in Ogun State and designed to welcome visitors
            from Nigeria and beyond.
          </p>
        </div>
      </section>

      <section className="bg-cream py-24">
        <div className="container-y grid gap-12 md:grid-cols-2 md:gap-16">
          {[
            {
              t: "Cultural purpose",
              b: "A gathering point for Yorùbá culture — dignified, contemporary and welcoming.",
            },
            {
              t: "Heritage preservation",
              b: "Care for oral traditions, craft, architecture and language, held with cultural custodians.",
            },
            {
              t: "Nature and conservation",
              b: "Forest, water and habitat protected as part of the visitor experience.",
            },
            {
              t: "Ogun State",
              b: "Located in Ogun State, connected to community, artisans and cultural institutions.",
            },
            {
              t: "Architecture",
              b: "Buildings designed with natural materials, quietly informed by traditional forms.",
            },
            {
              t: "Community & custodianship",
              b: "Programming shaped in partnership with elders, scholars and local stakeholders.",
            },
          ].map((c) => (
            <div key={c.t}>
              <p className="eyebrow">{c.t}</p>
              <p className="mt-3 font-serif text-2xl text-forest-deep">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-y py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <img
            src={waterImg}
            alt="Still water reflecting a forest at golden hour."
            loading="lazy"
            className="aspect-[4/5] size-full object-cover"
          />
          <div>
            <SectionHead
              eyebrow="Leadership"
              title="Custodians of the park."
              intro="Leadership profiles will be added following cultural and operational confirmation."
            />
            <ul className="mt-10 space-y-6">
              {["Executive Leadership", "Cultural Council", "Conservation Team"].map((r) => (
                <li
                  key={r}
                  className="flex items-center justify-between border-t border-border pt-4"
                >
                  <span className="font-serif text-lg text-forest-deep">{r}</span>
                  <span className="text-xs text-muted-foreground">To be confirmed</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
