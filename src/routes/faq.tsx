import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/Section";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Where is Yoruba Heritage Park located?",
    a: "Ogun State, Nigeria. Exact directions to be confirmed.",
  },
  { q: "What are the opening hours?", a: "Details to be confirmed." },
  { q: "Can I book a private tour?", a: "Yes — please use the ticketing page or contact us." },
  { q: "Are children welcome?", a: "Yes. Family-friendly experiences are clearly marked." },
  {
    q: "Is the site accessible?",
    a: "Accessibility details to be confirmed on the Plan Your Visit page.",
  },
  { q: "What should I wear?", a: "Modest, comfortable clothing suitable for walking outdoors." },
  {
    q: "Can I take photographs?",
    a: "Photography guidance will be shared on arrival. Sacred spaces may be restricted.",
  },
  {
    q: "How does the SOS work?",
    a: "A browser-based Visitor SOS is available from the main navigation.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — Yoruba Heritage Park" },
      { name: "description", content: "Answers to common visitor questions." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <PageHero eyebrow="Frequently Asked Questions" title="Answers, plainly given." />
      <section className="container-y max-w-3xl py-16">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-border">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-serif text-lg text-forest-deep md:text-xl">{f.q}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-clay transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && <p className="pb-6 text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </section>
    </>
  );
}
