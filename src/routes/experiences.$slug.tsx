import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { EXPERIENCES } from "@/lib/mock-data";

export const Route = createFileRoute("/experiences/$slug")({
  loader: ({ params }) => {
    const e = EXPERIENCES.find((x) => x.slug === params.slug);
    if (!e) throw notFound();
    return e;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title ?? "Experience"} — Yoruba Heritage Park`,
      },
    ],
  }),
  component: ExperienceDetail,
  notFoundComponent: () => (
    <div className="container-y py-32 text-center">
      <h1 className="font-serif text-4xl text-forest-deep">Not found</h1>
      <Link to="/experiences" className="mt-6 inline-block text-clay">
        ← All experiences
      </Link>
    </div>
  ),
  errorComponent: () => <div className="container-y py-32 text-center">Unavailable</div>,
});

function ExperienceDetail() {
  const e = Route.useLoaderData();
  return (
    <>
      <section className="relative h-[60dvh] min-h-[420px] bg-forest-deep text-ivory">
        <img
          src={e.image}
          alt={e.title}
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/40 to-forest-deep/90" />
        <div className="container-y relative flex h-full flex-col justify-end pb-16">
          <p className="eyebrow text-ivory/70">{e.category}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl md:text-6xl">{e.title}</h1>
        </div>
      </section>

      <section className="container-y grid gap-16 py-20 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Overview</p>
          <p className="mt-4 text-lg leading-[1.8] text-foreground/85">
            {e.summary} Full description pending operational and cultural confirmation.
          </p>

          <h2 className="mt-14 font-serif text-2xl text-forest-deep">What to expect</h2>
          <ul className="mt-4 space-y-2 text-foreground/80">
            {[
              "Meeting point and welcome",
              "Guided journey through relevant grounds",
              "Time for reflection and questions",
              "Return to visitor centre",
            ].map((li) => (
              <li key={li} className="border-l border-clay/60 pl-4">
                {li}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-serif text-2xl text-forest-deep">Visitor guidance</h2>
          <p className="mt-4 text-foreground/80">
            Please arrive fifteen minutes early. Wear comfortable footwear and modest attire.
            Photography guidance will be shared on arrival.
          </p>
        </div>

        <aside className="h-fit border border-border bg-cream p-8">
          <p className="eyebrow">Details</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="mt-1 font-serif text-lg text-forest-deep">{e.duration}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="mt-1 font-serif text-lg text-forest-deep">{e.availability}</dd>
            </div>
          </dl>
          <Link
            to="/tickets"
            className="mt-8 flex justify-center rounded-full bg-forest-deep px-5 py-3 text-sm text-ivory hover:bg-forest"
          >
            Book or Enquire
          </Link>
          <Link
            to="/experiences"
            className="mt-3 flex justify-center rounded-full border border-border px-5 py-3 text-sm text-forest-deep"
          >
            All experiences
          </Link>
        </aside>
      </section>
    </>
  );
}
