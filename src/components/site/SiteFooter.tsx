import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/mock-data";

const cols = [
  {
    title: "Visit",
    links: [
      { to: "/plan", label: "Plan Your Visit" },
      { to: "/tickets", label: "Ticket Details" },
      { to: "/events", label: "Events" },
      { to: "/faq", label: "Frequently Asked Questions" },
    ],
  },
  {
    title: "Explore",
    links: [
      { to: "/discover", label: "Discover" },
      { to: "/experiences", label: "Experiences" },
      { to: "/oriki", label: "Oríkì and Heritage" },
      { to: "/ceremonies", label: "Ceremonies" },
      { to: "/stay", label: "Stay and Own" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: "/learn", label: "Learning Hub" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Safety",
    links: [{ to: "/faq", label: "Visitor Guidance" }],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-forest-deep text-ivory">
      <div className="container-y grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <p className="eyebrow text-ivory/60">{SITE.location}</p>
          <h3 className="mt-2 font-serif text-2xl">{SITE.name}</h3>
          <p className="mt-4 text-sm leading-relaxed text-ivory/70">
            A living Yorùbá experience — culture, nature, prayer, discovery and renewal.
          </p>
          <p className="mt-6 text-xs text-ivory/50">
            Details will be published following operational confirmation.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="eyebrow text-ivory/60">{c.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ivory/85 transition hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-y flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-ivory/50">
          <span>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          <span>Ogun State · Nigeria</span>
        </div>
      </div>
    </footer>
  );
}
