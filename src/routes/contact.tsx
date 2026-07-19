import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/Section";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Yoruba Heritage Park" },
      { name: "description", content: "Get in touch with Yoruba Heritage Park." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Be in touch." intro="We welcome enquiries." />

      <section className="container-y grid gap-14 py-20 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-8">
          {[
            { i: MapPin, l: "Address", v: "Ogun State, Nigeria" },
            { i: Mail, l: "Email", v: "To be confirmed" },
            { i: Phone, l: "Phone", v: "To be confirmed" },
          ].map((c) => (
            <div key={c.l} className="flex gap-4 border-t border-border pt-6">
              <c.i className="mt-1 size-5 shrink-0 text-clay" />
              <div>
                <p className="eyebrow">{c.l}</p>
                <p className="mt-1 font-serif text-xl text-forest-deep">{c.v}</p>
              </div>
            </div>
          ))}
        </div>

        <form className="h-fit border border-border bg-cream p-8">
          <p className="eyebrow">Send a message</p>
          <div className="mt-6 grid gap-4">
            {[
              { l: "Full name", t: "text" },
              { l: "Email", t: "email" },
              { l: "Subject", t: "text" },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="text-sm">{f.l}</span>
                <input
                  type={f.t}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm">Message</span>
              <textarea
                rows={5}
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
              />
            </label>
            <button
              type="button"
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-full bg-forest-deep px-5 py-3 text-sm text-ivory opacity-70"
            >
              Send Message
            </button>
            <p className="text-xs text-muted-foreground">
              Message delivery will be enabled following operational confirmation.
            </p>
          </div>
        </form>
      </section>
    </>
  );
}
