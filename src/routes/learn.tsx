import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";
import { BookOpen, Download, Headphones, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learning Hub — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Park history, heritage, architecture, conservation, school resources and audio guides.",
      },
    ],
  }),
  component: LearnPage,
});

const cards = [
  { icon: BookOpen, title: "Park history", action: "Read" },
  { icon: BookOpen, title: "Yoruba heritage", action: "Read" },
  { icon: BookOpen, title: "Architecture", action: "Read" },
  { icon: BookOpen, title: "Conservation", action: "Read" },
  { icon: GraduationCap, title: "School groups", action: "Plan a School Visit" },
  { icon: Download, title: "Teacher resources", action: "Download" },
  { icon: Download, title: "Educational PDFs", action: "Download" },
  { icon: Headphones, title: "Audio guides", action: "Listen" },
  { icon: BookOpen, title: "Research enquiries", action: "Contact" },
  { icon: BookOpen, title: "Media resources", action: "Request" },
];

function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learning Hub"
        title="Study, listen and share."
        intro="Educational resources for students, teachers, researchers and visitors."
      />

      <section className="container-y py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="flex flex-col border border-border bg-background p-7">
              <c.icon className="size-5 text-clay" aria-hidden />
              <h3 className="mt-6 font-serif text-2xl text-forest-deep">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sample resource — pending operational confirmation.
              </p>
              <button className="mt-6 self-start text-xs font-medium text-forest-deep hover:text-clay">
                {c.action} →
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
