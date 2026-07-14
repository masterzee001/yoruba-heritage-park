import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Compass,
  CalendarDays,
  BookOpen,
  Home as HomeIcon,
  ChevronDown,
} from "lucide-react";
import heroImg from "@/assets/hero-entrance.jpg";
import cultureImg from "@/assets/culture-architecture.jpg";
import waterImg from "@/assets/water-reflection.jpg";
import stayImg from "@/assets/stay-hut.jpg";
import { EXPERIENCES, EVENTS } from "@/lib/mock-data";
import { SectionHead } from "@/components/site/Section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yorùbá Heritage Park — Enter a Living Yorùbá World" },
      {
        name: "description",
        content:
          "A premium Yorùbá cultural, spiritual and nature destination in Ogun State, Nigeria.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* 1. CINEMATIC ENTRANCE */}
      <section className="relative isolate -mt-[4.5rem] h-svh min-h-[680px] w-full overflow-hidden bg-forest-deep pt-[4.5rem] text-ivory lg:-mt-24 lg:min-h-[760px] lg:pt-24">
        <img
          src={heroImg}
          alt="A carved wooden gateway opens onto a natural forest pathway lit by dawn light."
          className="absolute inset-0 size-full object-cover object-[66%_center] sm:object-[62%_center] xl:object-center"
          width={1920}
          height={1280}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.08_0.02_155/0.98)_0%,oklch(0.12_0.028_155/0.94)_25%,oklch(0.18_0.035_155/0.72)_43%,oklch(0.22_0.04_155/0.22)_66%,transparent_86%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.08_0.018_155/0.84)_0%,transparent_34%,oklch(0.08_0.018_155/0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,transparent_0%,transparent_34%,oklch(0.06_0.015_155/0.44)_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] mix-blend-soft-light bg-[radial-gradient(circle_at_1px_1px,oklch(0.97_0.012_85)_1px,transparent_0)] bg-[length:3px_3px]" />

        <div className="relative z-10 container-y flex h-full items-center pb-20 pt-10 sm:pb-24 lg:pb-28">
          <div className="w-full max-w-[45rem]">
            <div className="fade-up flex items-center gap-4">
              <span className="h-px w-10 bg-gold/85 sm:w-14" aria-hidden />
              <p className="eyebrow text-[0.62rem] font-semibold text-gold/85 sm:text-[0.72rem]">
                THE SACRED JOURNEY
              </p>
            </div>

            <h1 className="fade-up mt-6 max-w-[11ch] font-serif text-[clamp(3.55rem,8.9vw,7.35rem)] leading-[0.92] tracking-[-0.018em] text-ivory text-balance [animation-delay:100ms]">
              <span className="block">Enter a Living</span>
              <span className="block">Yorùbá World.</span>
            </h1>

            <div className="fade-up mt-7 text-ivory/82 sm:mt-8 [animation-delay:180ms]">
              <span className="mb-6 block h-px w-12 bg-gold/85" aria-hidden />
              <p className="max-w-[34rem] font-serif text-xl leading-relaxed sm:text-2xl">
                Where culture meets nature, prayer sparks discovery,
                <br className="hidden sm:block" />
                and every path leads to renewal.
              </p>
              <p className="mt-7 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold/85">
                <MapPin className="size-4" aria-hidden />
                Ogun State, Nigeria
              </p>
            </div>

            <div className="fade-up mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row [animation-delay:260ms]">
              <Link
                to="/discover"
                className="group inline-flex min-h-14 items-center justify-center gap-5 rounded-md border border-gold/40 bg-gold px-8 py-3 text-base font-medium text-forest-deep shadow-[0_14px_36px_oklch(0.1_0.02_155/0.36)] transition duration-300 hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep sm:min-w-56"
              >
                Discover the Park
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/plan"
                className="inline-flex min-h-14 items-center justify-center rounded-md border border-gold/55 bg-forest-deep/25 px-8 py-3 text-base font-medium text-ivory backdrop-blur-sm transition duration-300 hover:border-gold hover:bg-ivory/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-w-52"
              >
                Plan Your Visit
              </Link>
            </div>
          </div>
        </div>

        <div className="fade-up pointer-events-none absolute bottom-8 left-6 z-10 hidden items-center gap-5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-gold/75 md:left-10 lg:flex [animation-delay:340ms]">
          <span className="grid size-12 place-items-center rounded-full border border-gold/55 text-ivory/90">
            <ChevronDown className="size-4" aria-hidden />
          </span>
          <span>Continue the Journey</span>
        </div>
      </section>

      {/* 2. INTRODUCTION */}
      <section className="container-y py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-20">
          <div>
            <p className="eyebrow">Introduction</p>
            <h2 className="mt-4 font-serif text-3xl leading-[1.1] text-forest-deep md:text-5xl text-balance">
              Rooted in Ogun State. Inspired by Yorùbá heritage. Created for the world.
            </h2>
          </div>
          <div className="flex items-center">
            <p className="text-base leading-[1.8] text-foreground/80 md:text-lg">
              Yoruba Heritage Park brings together culture, spirituality, nature, education,
              community and visitor experience within a single, carefully curated destination — a
              place to walk, to learn, to reflect and to return.
            </p>
          </div>
        </div>
      </section>

      {/* 3. VISITOR PATHWAYS */}
      <section className="bg-cream py-24 md:py-32">
        <div className="container-y">
          <SectionHead
            eyebrow="Three pathways"
            title="Enter the park in the way that speaks to you."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                to: "/discover",
                eyebrow: "Discover",
                title: "The Sacred World",
                desc: "Cultural, spiritual and natural landscapes across the park.",
                img: cultureImg,
              },
              {
                to: "/experiences",
                eyebrow: "Experience",
                title: "Living Encounters",
                desc: "Tours, walks, workshops, ceremonies and consultations.",
                img: waterImg,
              },
              {
                to: "/plan",
                eyebrow: "Plan",
                title: "Your Journey",
                desc: "Hours, tickets, transport, accessibility and guidance.",
                img: heroImg,
              },
            ].map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className="group relative flex aspect-[3/4] overflow-hidden bg-forest-deep text-ivory"
              >
                <img
                  src={p.img}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-[1600ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/40 to-transparent" />
                <div className="relative z-10 mt-auto p-7">
                  <p className="eyebrow text-ivory/70">{p.eyebrow}</p>
                  <h3 className="mt-2 font-serif text-2xl md:text-3xl">{p.title}</h3>
                  <p className="mt-3 max-w-xs text-sm text-ivory/80">{p.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
                    Enter <ArrowRight className="size-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE MAP PREVIEW */}
      <section className="container-y py-24 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-end">
          <div>
            <p className="eyebrow">The park</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest-deep md:text-5xl">
              A map of gathered places.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Cultural grounds, sacred spaces, forest trails, workshop houses, event lawns and quiet
              places for reflection. Final location details will be published following operational
              confirmation.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["All", "Cultural", "Sacred", "Nature", "Workshops", "Facilities"].map((f, i) => (
                <button
                  key={f}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    i === 0
                      ? "border-forest-deep bg-forest-deep text-ivory"
                      : "border-border text-foreground/70 hover:border-forest"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Link
              to="/discover"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-forest-deep underline-offset-4 hover:underline"
            >
              View Map <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border bg-[oklch(0.94_0.02_140)]">
            {/* Stylised map */}
            <svg viewBox="0 0 600 450" className="absolute inset-0 size-full" aria-hidden>
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="oklch(0.88 0.03 140)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="600" height="450" fill="url(#grid)" />
              <path
                d="M40,340 C 150,300 200,360 320,280 S 520,240 580,180"
                stroke="oklch(0.52 0.06 140)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 6"
              />
              <path
                d="M100,120 C 220,140 240,220 380,200 S 520,320 560,380"
                stroke="oklch(0.58 0.09 45)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 6"
              />
              <circle cx="120" cy="150" r="60" fill="oklch(0.94 0.02 140 / 0.6)" />
              <circle cx="420" cy="260" r="80" fill="oklch(0.94 0.02 140 / 0.6)" />
            </svg>
            {[
              { x: "18%", y: "72%", label: "Main Entrance" },
              { x: "34%", y: "42%", label: "Cultural Grounds" },
              { x: "58%", y: "56%", label: "Sacred Grove" },
              { x: "72%", y: "30%", label: "Nature Trails" },
              { x: "48%", y: "78%", label: "Event Lawn" },
              { x: "82%", y: "68%", label: "Vacation Huts" },
            ].map((m) => (
              <div
                key={m.label}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
                style={{ left: m.x, top: m.y }}
              >
                <span className="grid size-3 place-items-center rounded-full bg-forest-deep ring-4 ring-forest-deep/15" />
                <span className="whitespace-nowrap rounded-sm bg-background/95 px-2 py-0.5 text-[11px] font-medium text-forest-deep shadow-sm">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SIGNATURE EXPERIENCES */}
      <section className="bg-forest-deep py-24 text-ivory md:py-32">
        <div className="container-y">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-ivory/60">Signature</p>
              <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight md:text-5xl">
                Six ways to enter the experience.
              </h2>
            </div>
            <Link to="/experiences" className="text-sm underline-offset-4 hover:underline">
              View all experiences →
            </Link>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCES.map((e) => (
              <Link
                key={e.slug}
                to="/experiences/$slug"
                params={{ slug: e.slug }}
                className="group flex flex-col overflow-hidden border border-ivory/10 bg-forest transition hover:border-gold/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={e.image}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow text-gold/80">{e.category}</p>
                  <h3 className="mt-3 font-serif text-2xl text-ivory">{e.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/70">{e.summary}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-ivory/10 pt-4 text-xs text-ivory/60">
                    <span>{e.duration}</span>
                    <span className="text-gold">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. UPCOMING EVENTS */}
      <section className="container-y py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow="Upcoming"
            title="Events at the park."
            intro="Indicative schedule. The final calendar will be published following operational confirmation."
          />
          <Link
            to="/events"
            className="text-sm font-medium text-forest-deep underline-offset-4 hover:underline"
          >
            View Full Calendar →
          </Link>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((ev) => (
            <article key={ev.slug} className="flex flex-col gap-4 bg-background p-7">
              <p className="eyebrow">{ev.category}</p>
              <h3 className="font-serif text-2xl text-forest-deep">{ev.title}</h3>
              <dl className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
                <dt className="sr-only">Date</dt>
                <dd>{ev.date}</dd>
                <dt className="sr-only">Time</dt>
                <dd>{ev.time}</dd>
              </dl>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">{ev.availability}</span>
                <Link
                  to="/events/$slug"
                  params={{ slug: ev.slug }}
                  className="text-xs font-medium text-forest-deep hover:text-clay"
                >
                  View Event →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 7. ORÍKÌ AND CEREMONIES */}
      <section className="bg-cream py-24 md:py-32">
        <div className="container-y grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={cultureImg}
              alt="Warm earthen architecture with carved wooden windows at golden hour."
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Heritage services</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-forest-deep md:text-5xl text-balance">
              Oríkì, ceremonies and family occasions.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Personal and family Oríkì, Yorùbá naming ceremonies, weddings, private prayer and
              cultural celebrations — held with dignity in spaces designed for gathering.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                "Personal Oríkì",
                "Family Oríkì",
                "Naming ceremonies",
                "Weddings",
                "Private prayer",
                "Cultural celebrations",
              ].map((i) => (
                <li key={i} className="border-l border-clay/60 pl-3 text-foreground/80">
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/oriki"
                className="rounded-full bg-forest-deep px-6 py-3 text-sm text-ivory hover:bg-forest"
              >
                Oríkì and Heritage
              </Link>
              <Link
                to="/ceremonies"
                className="rounded-full border border-forest-deep/40 px-6 py-3 text-sm text-forest-deep hover:bg-forest-deep hover:text-ivory"
              >
                Ceremonies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LEARNING HUB */}
      <section className="container-y py-24 md:py-32">
        <SectionHead
          eyebrow="Learning Hub"
          title="Resources to study, listen and share."
          intro="For students, teachers, researchers and visitors."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Park History", action: "Read" },
            { icon: BookOpen, title: "Architecture Notes", action: "Download" },
            { icon: BookOpen, title: "Conservation", action: "Read" },
            { icon: BookOpen, title: "Audio Guides", action: "Listen" },
            { icon: BookOpen, title: "School Visits", action: "Plan a Visit" },
            { icon: BookOpen, title: "Teacher Resources", action: "Download" },
          ].map((c) => (
            <div
              key={c.title}
              className="flex flex-col border border-border bg-background p-7 transition hover:border-forest"
            >
              <c.icon className="size-5 text-clay" aria-hidden />
              <h3 className="mt-6 font-serif text-2xl text-forest-deep">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Resource details will be published following operational confirmation.
              </p>
              <Link
                to="/learn"
                className="mt-6 text-xs font-medium text-forest-deep hover:text-clay"
              >
                {c.action} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 9. STAY AND OWN */}
      <section className="relative overflow-hidden bg-forest-deep py-24 text-ivory md:py-32">
        <img
          src={stayImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/85 to-forest-deep/50" />
        <div className="container-y relative grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow text-ivory/60">Stay and Own</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight md:text-5xl">
              A quiet home within the forest.
            </h2>
            <p className="mt-5 max-w-md text-ivory/80">
              A limited collection of vacation huts, designed with natural materials and set into
              the landscape. Ownership and inspection by enquiry only.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/stay"
                className="rounded-full bg-ivory px-6 py-3 text-sm text-forest-deep hover:bg-gold"
              >
                Explore the Huts
              </Link>
              <Link
                to="/stay"
                className="rounded-full border border-ivory/40 px-6 py-3 text-sm text-ivory hover:bg-ivory/10"
              >
                Request Information
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. VISITOR INFORMATION */}
      <section className="container-y py-24 md:py-32">
        <SectionHead
          eyebrow="Visitor information"
          title="Everything you need to plan a considered visit."
        />
        <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Opening hours", value: "Details to be confirmed" },
            { label: "Admission", value: "Details to be confirmed" },
            { label: "Location", value: "Ogun State, Nigeria", icon: MapPin },
            { label: "Transport", value: "Details to be confirmed" },
            { label: "Parking", value: "On-site — to be confirmed" },
            { label: "Accessibility", value: "Details to be confirmed" },
            { label: "Contact", value: "See contact page" },
            { label: "Tickets", value: "Visit requests", link: "/tickets" },
          ].map((i) => (
            <div key={i.label} className="bg-background p-7">
              <p className="eyebrow">{i.label}</p>
              <p className="mt-3 font-serif text-lg text-forest-deep">{i.value}</p>
              {i.link && (
                <Link
                  to={i.link}
                  className="mt-3 inline-block text-xs font-medium text-clay hover:text-forest-deep"
                >
                  View Ticket Details →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
