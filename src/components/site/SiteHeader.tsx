import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { NAV } from "@/lib/mock-data";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-forest-deep/58 text-ivory shadow-[0_1px_0_oklch(0.72_0.11_82/0.06)] backdrop-blur-2xl">
      <div className="container-y flex h-[4.5rem] items-center gap-4 lg:h-24 xl:gap-7">
        <Link
          to="/"
          aria-label="Yoruba Heritage Park home"
          className="group flex min-w-0 items-center gap-3.5 lg:gap-4"
        >
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/45 bg-forest-deep shadow-[0_0_0_4px_oklch(0.97_0.012_85/0.035)] transition duration-300 group-hover:border-gold/75 sm:size-13 lg:size-14">
            <img
              src="/brand/favicon-source.png"
              alt=""
              className="size-full rounded-full object-cover"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[0.55rem] font-semibold tracking-[0.24em] text-gold/85 uppercase sm:text-[0.62rem]">
              OGUN STATE, NIGERIA
            </span>
            <span className="mt-1 truncate font-serif text-[1rem] text-ivory sm:text-[1.18rem] lg:text-[1.28rem]">
              Yorùbá Heritage Park
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-5 text-[0.68rem] font-semibold tracking-[0.14em] uppercase xl:flex 2xl:gap-7">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="relative py-3 text-ivory/70 transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold/85 after:transition-transform after:duration-300 hover:text-ivory hover:after:scale-x-100"
              activeProps={{ className: "text-gold after:scale-x-100" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <button
            type="button"
            aria-label="Search"
            disabled
            className="hidden size-11 place-items-center rounded-full border border-gold/35 bg-forest-deep/25 text-ivory/90 opacity-60 xl:grid"
          >
            <Search className="size-4" aria-hidden />
          </button>
          <Link
            to="/tickets"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-gold/30 bg-gold px-4 py-2 text-[0.68rem] font-bold tracking-[0.1em] text-forest-deep uppercase shadow-[0_12px_28px_oklch(0.12_0.02_155/0.32)] transition duration-300 hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep sm:px-5 lg:min-h-11 lg:px-6"
          >
            Tickets
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-ivory/20 bg-ivory/[0.04] text-ivory transition hover:border-ivory/40 hover:bg-ivory/10 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-navigation"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-navigation"
          className="border-t border-gold/15 bg-forest-deep/96 text-ivory shadow-2xl backdrop-blur-xl xl:hidden"
        >
          <nav className="container-y py-5 sm:py-6" aria-label="Mobile navigation">
            <div className="grid sm:grid-cols-2 sm:gap-x-8">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-ivory/10 py-3.5 font-serif text-lg text-ivory/85 transition hover:border-gold/40 hover:text-gold"
                >
                  {n.label}
                  <span className="text-xs font-sans text-gold/60" aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled
                className="flex-1 rounded-full border border-gold/35 px-4 py-3 text-center text-sm text-ivory/85 opacity-60"
              >
                Search
              </button>
              <Link
                to="/tickets"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-gold px-4 py-3 text-center text-sm font-semibold text-forest-deep transition hover:bg-ivory"
              >
                Tickets
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
