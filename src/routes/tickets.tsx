import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/Section";
import { TICKET_TYPES } from "@/lib/mock-data";
import { Check, QrCode } from "lucide-react";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Buy Tickets — Yoruba Heritage Park" },
      {
        name: "description",
        content:
          "Book general admission, guided tours, cultural tours, prayer walks and group visits.",
      },
    ],
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const [step, setStep] = useState(1);
  const [ticket, setTicket] = useState(TICKET_TYPES[0].id);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const price = 5000; // sample NGN placeholder
  const total = adults * price + children * (price / 2);

  return (
    <>
      <PageHero
        eyebrow="Buy Tickets"
        title="Booking, in three considered steps."
        intro="Prototype only. No payment is processed."
      />

      <section className="container-y py-16">
        <ol className="mb-10 flex items-center gap-4 text-xs">
          {["Choose", "Schedule", "Details"].map((label, i) => {
            const n = i + 1;
            const active = step >= n;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`grid size-7 place-items-center rounded-full border text-[11px] ${
                    active
                      ? "border-forest-deep bg-forest-deep text-ivory"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {step > n ? <Check className="size-3.5" /> : n}
                </span>
                <span className={active ? "text-forest-deep" : "text-muted-foreground"}>
                  {label}
                </span>
                {n < 3 && <span className="ml-2 h-px w-8 bg-border" />}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
          <div className="border border-border bg-background p-8">
            {step === 1 && (
              <>
                <h2 className="font-serif text-2xl text-forest-deep">Choose a ticket</h2>
                <div className="mt-6 grid gap-3">
                  {TICKET_TYPES.map((t) => (
                    <label
                      key={t.id}
                      className={`flex cursor-pointer items-center justify-between rounded-sm border p-4 transition ${
                        ticket === t.id
                          ? "border-forest-deep bg-cream"
                          : "border-border hover:border-forest"
                      }`}
                    >
                      <span className="font-serif text-lg text-forest-deep">{t.label}</span>
                      <input
                        type="radio"
                        name="ticket"
                        checked={ticket === t.id}
                        onChange={() => setTicket(t.id)}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-serif text-2xl text-forest-deep">Select date and party</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm">Date</span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Time</span>
                    <select className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5">
                      <option>10:00</option>
                      <option>14:00</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm">Adults</span>
                    <input
                      type="number"
                      min={0}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Children</span>
                    <input
                      type="number"
                      min={0}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Group category</span>
                    <select className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5">
                      <option>Individual / family</option>
                      <option>School</option>
                      <option>Private group</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pt-6">
                    <input type="checkbox" />{" "}
                    <span className="text-sm">Add designated tour bus</span>
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-2xl text-forest-deep">Visitor details</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { l: "Full name", t: "text" },
                    { l: "Email", t: "email" },
                    { l: "Phone number", t: "tel" },
                    { l: "Emergency contact", t: "tel" },
                  ].map((f) => (
                    <label key={f.l} className="block">
                      <span className="text-sm">{f.l}</span>
                      <input
                        type={f.t}
                        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                      />
                    </label>
                  ))}
                  <label className="block sm:col-span-2">
                    <span className="text-sm">Booking notes</span>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-forest-deep text-ivory">
                  <Check className="size-6" />
                </div>
                <h2 className="mt-6 font-serif text-3xl text-forest-deep">Booking confirmed</h2>
                <p className="mt-3 text-muted-foreground">
                  Sample confirmation. Reference #YHP-2026-0421.
                </p>
                <div className="mx-auto mt-10 max-w-sm border border-border bg-cream p-6 text-left">
                  <p className="eyebrow">Digital ticket</p>
                  <p className="mt-2 font-serif text-xl text-forest-deep">
                    {TICKET_TYPES.find((t) => t.id === ticket)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {adults} adults · {children} children
                  </p>
                  <div className="mt-6 flex justify-center rounded-sm border border-dashed border-border p-6">
                    <QrCode className="size-32 text-forest-deep" aria-hidden />
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">QR placeholder</p>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="mt-10 flex justify-between border-t border-border pt-6">
                <button
                  disabled={step === 1}
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-full bg-forest-deep px-6 py-2.5 text-sm text-ivory"
                >
                  {step === 3 ? "Continue to payment" : "Continue"}
                </button>
              </div>
            )}
          </div>

          <aside className="h-fit border border-border bg-cream p-6">
            <p className="eyebrow">Booking summary</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ticket</dt>
                <dd>{TICKET_TYPES.find((t) => t.id === ticket)?.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adults</dt>
                <dd>{adults}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Children</dt>
                <dd>{children}</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-serif text-lg text-forest-deep">
                <dt>Total</dt>
                <dd>₦{total.toLocaleString()}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Mock pricing only. No payment processed.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
