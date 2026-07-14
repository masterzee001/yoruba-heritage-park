import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { EVENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/events/$slug")({
  loader: ({ params }) => {
    const e = EVENTS.find((x) => x.slug === params.slug);
    if (!e) throw notFound();
    return e;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Event"} — Yoruba Heritage Park` }],
  }),
  notFoundComponent: () => (
    <div className="container-y py-32 text-center">
      <h1 className="font-serif text-4xl text-forest-deep">Not found</h1>
      <Link to="/events" className="mt-6 inline-block text-clay">
        ← Events calendar
      </Link>
    </div>
  ),
  errorComponent: () => <div className="container-y py-32 text-center">Unavailable</div>,
  component: EventDetail,
});

function EventDetail() {
  const e = Route.useLoaderData();
  return (
    <section className="container-y py-24">
      <p className="eyebrow">{e.category}</p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl text-forest-deep md:text-6xl">{e.title}</h1>
      <p className="mt-4 text-muted-foreground">
        {e.date} · {e.time} · {e.availability}
      </p>

      <div className="mt-14 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 text-foreground/85">
          <p>
            Sample event description. Please arrive fifteen minutes before the scheduled start.
            Meeting point will be confirmed on booking.
          </p>
          <p>Content pending operational confirmation.</p>
        </div>
        <aside className="h-fit border border-border bg-cream p-8">
          <p className="eyebrow">Reserve</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Places are limited. Confirm on the ticketing page.
          </p>
          <Link
            to="/tickets"
            className="mt-6 flex justify-center rounded-full bg-forest-deep px-5 py-3 text-sm text-ivory"
          >
            Reserve Place
          </Link>
        </aside>
      </div>
    </section>
  );
}
