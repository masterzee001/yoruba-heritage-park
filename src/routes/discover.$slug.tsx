import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";

const SUBJECTS: Record<string, { name: string; body: string }> = {
  sango: { name: "Ṣàngó", body: "Cultural profile placeholder — pending cultural review." },
  yemoja: { name: "Yemoja", body: "Cultural profile placeholder — pending cultural review." },
  ijebu: { name: "Ijèbú Traditions", body: "Placeholder cultural notes for review." },
  nature: { name: "Nature", body: "Forest, water and living habitat within the park." },
  architecture: {
    name: "Architecture",
    body: "Traditional forms and contemporary reinterpretations.",
  },
  history: { name: "Park History", body: "Historical narrative to be confirmed." },
};

export const Route = createFileRoute("/discover/$slug")({
  loader: ({ params }) => {
    const item = SUBJECTS[params.slug];
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name ?? "Discover"} — Yoruba Heritage Park`,
      },
    ],
  }),
  component: SubjectDetail,
  notFoundComponent: () => (
    <div className="container-y py-32 text-center">
      <p className="eyebrow">Subject not found</p>
      <h1 className="mt-4 font-serif text-4xl text-forest-deep">Not found</h1>
      <Link to="/discover" className="mt-8 inline-block text-clay">
        ← Back to Discover
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-y py-32 text-center">
      <h1 className="font-serif text-3xl text-forest-deep">Unavailable</h1>
    </div>
  ),
});

function SubjectDetail() {
  const item = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Cultural subject" title={item.name} intro={item.body} />
      <section className="container-y max-w-2xl py-24">
        <p className="eyebrow">Pending cultural approval</p>
        <p className="mt-4 text-lg leading-relaxed text-foreground/80">
          Full text for this cultural subject will be added following review by the cultural
          council. Content shown here is a placeholder for layout purposes only.
        </p>
        <Link
          to="/discover"
          className="mt-10 inline-block text-sm font-medium text-forest-deep hover:text-clay"
        >
          ← Back to Discover
        </Link>
      </section>
    </>
  );
}
