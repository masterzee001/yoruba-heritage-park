import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";
import waterImg from "@/assets/water-reflection.jpg";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "The sacred world, the Òrìṣà, Ijèbú traditions, nature and architecture at Yoruba Heritage Park.",
      },
    ],
  }),
  component: DiscoverPage,
});

const subjects = [
  { slug: "sango", name: "Ṣàngó", note: "Cultural profile pending cultural review." },
  { slug: "yemoja", name: "Yemoja", note: "Cultural profile pending cultural review." },
  { slug: "ijebu", name: "Ijèbú Traditions", note: "Description pending cultural review." },
  { slug: "nature", name: "Nature", note: "Forest, water and living habitat." },
  { slug: "architecture", name: "Architecture", note: "Traditional and contemporary form." },
  { slug: "history", name: "Park History", note: "To be confirmed." },
];

function DiscoverPage() {
  return (
    <>
      <PageHero
        eyebrow="Discover"
        title="The Sacred World"
        intro="A respectful introduction to the cultural, spiritual and natural landscape of the park."
        image={waterImg}
      />

      {/* Olódùmárè — set apart */}
      <section className="border-b border-border bg-cream py-24">
        <div className="container-y max-w-3xl text-center">
          <p className="eyebrow">Above and beyond</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest-deep md:text-6xl">
            Olódùmárè
          </h2>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            ALL MIGHTY GOD
          </p>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Held in reverence above all. Introduced here with a hierarchy of respect and not
            presented as one profile among equal cards. Full content pending cultural approval.
          </p>
        </div>
      </section>

      <section className="container-y py-24">
        <p className="eyebrow">The Òrìṣà and cultural subjects</p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-forest-deep md:text-5xl">
          Profiles for study and reflection.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Descriptions here are pending cultural review. No religious claims, historical dates or
          ritual instructions are presented as final.
        </p>

        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link
              key={s.slug}
              to="/discover/$slug"
              params={{ slug: s.slug }}
              className="flex flex-col gap-3 bg-background p-8 transition hover:bg-cream"
            >
              <p className="eyebrow">Cultural subject</p>
              <h3 className="font-serif text-3xl text-forest-deep">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.note}</p>
              <span className="mt-4 text-xs font-medium text-clay">Read more →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-forest-deep py-24 text-ivory">
        <div className="container-y max-w-3xl">
          <p className="eyebrow text-ivory/60">Interactive map</p>
          <h2 className="mt-3 font-serif text-3xl md:text-5xl">A living map of the park.</h2>
          <p className="mt-4 text-ivory/75">
            Cultural areas, sacred spaces, nature trails, workshop locations, event spaces,
            accommodation areas and restricted zones. Final layout details will be published
            following operational confirmation.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-full bg-ivory px-6 py-3 text-sm text-forest-deep hover:bg-gold"
          >
            View Map Preview
          </Link>
        </div>
      </section>
    </>
  );
}
