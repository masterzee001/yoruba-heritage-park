import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";
import orikiHeroImg from "@/assets/oriki-heritage-presentation.png";

export const Route = createFileRoute("/oriki")({
  head: () => ({
    meta: [
      { title: "Oríkì and Heritage — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Personal and family Oríkì, written and audio presentations, and heritage consultations.",
      },
    ],
  }),
  component: OrikiPage,
});

function OrikiPage() {
  return (
    <>
      <PageHero
        eyebrow="Oríkì and Heritage"
        title="A name that carries you."
        intro="Personal and family Oríkì, presented in writing or audio, with heritage consultation."
        image={orikiHeroImg}
      />

      <section className="container-y grid gap-14 py-20 md:grid-cols-[1.2fr_1fr] md:gap-20">
        <div>
          <p className="eyebrow">Services</p>
          <div className="mt-6 space-y-8">
            {[
              { t: "Personal Oríkì", b: "A carefully researched Oríkì for an individual." },
              { t: "Family Oríkì", b: "Extended family Oríkì, presented with lineage notes." },
              { t: "Written presentation", b: "A printed and bound Oríkì document." },
              { t: "Audio recording", b: "A recorded Oríkì by a trained voice." },
              { t: "Heritage consultation", b: "A sitting with a heritage consultant." },
              { t: "Family-history enquiry", b: "Supported research to inform your Oríkì." },
              { t: "Naming ceremonies", b: "Support for traditional naming ceremonies." },
            ].map((s) => (
              <div key={s.t} className="border-t border-border pt-6">
                <h3 className="font-serif text-2xl text-forest-deep">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit border border-border bg-cream p-8">
          <p className="eyebrow">Consultation enquiry</p>
          <form className="mt-6 space-y-4">
            {[
              { l: "Full name", t: "text" },
              { l: "Email", t: "email" },
              { l: "Phone", t: "tel" },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="text-sm text-foreground/80">{f.l}</span>
                <input
                  type={f.t}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-forest focus:outline-none"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm text-foreground/80">Notes</span>
              <textarea
                rows={4}
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-forest focus:outline-none"
              />
            </label>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-forest-deep px-5 py-3 text-sm text-ivory opacity-70"
            >
              Send Enquiry
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
