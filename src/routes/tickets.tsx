import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";

import {
  lookupPublicBookingOrPaymentStatus,
  submitPublicBookingRequest,
  type PublicStatusLookupResult,
} from "@/booking/booking-functions";
import { PageHero } from "@/components/site/Section";
import { projectStatus } from "@/config/project-status";
import { TICKET_TYPES } from "@/lib/mock-data";

export const Route = createFileRoute("/tickets")({
  validateSearch: (search: Record<string, unknown>) => ({
    checkout:
      search.checkout === "success" || search.checkout === "cancelled"
        ? search.checkout
        : undefined,
    paymentReference:
      typeof search.paymentReference === "string" ? search.paymentReference : undefined,
    provider: typeof search.provider === "string" ? search.provider : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ticket Details — Yoruba Heritage Park" },
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
  const checkoutReturn = Route.useSearch();
  const [step, setStep] = useState(1);
  const [ticket, setTicket] = useState(TICKET_TYPES[0].id);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("10:00");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [durationOfStayDays, setDurationOfStayDays] = useState(1);
  const [groupCategory, setGroupCategory] = useState("Individual / family");
  const [addTourBus, setAddTourBus] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusReference, setStatusReference] = useState(checkoutReturn.paymentReference ?? "");
  const [statusLookupResult, setStatusLookupResult] = useState<PublicStatusLookupResult | null>(
    null,
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  const selectedTicket = TICKET_TYPES.find((t) => t.id === ticket);
  const bookingEnabled = projectStatus.bookingEnabled;
  const paymentEnabled = projectStatus.paymentEnabled;

  async function handleSubmitRequest() {
    setMessage(null);

    if (!bookingEnabled) {
      setMessage(
        "Booking requests are not active yet. Details will be published following operational confirmation.",
      );
      return;
    }

    if (
      !selectedTicket ||
      !visitDate ||
      !visitorName.trim() ||
      !visitorEmail.trim() ||
      !phone.trim() ||
      !emergencyContact.trim() ||
      !countryOfOrigin.trim()
    ) {
      setMessage("Please complete the required booking details before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPublicBookingRequest({
        data: {
          ticketId: ticket,
          ticketLabel: selectedTicket.label,
          visitDate,
          visitTime,
          adults,
          children,
          durationOfStayDays,
          groupCategory,
          addTourBus,
          visitorName,
          visitorEmail,
          phone,
          emergencyContact,
          countryOfOrigin,
          notes,
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setBookingReference(result.reference);
      setMessage(result.message);
      setStep(4);
    } catch (error) {
      console.error(error);
      setMessage("Booking request could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusLookup() {
    const reference = statusReference.trim();
    if (!reference) {
      setStatusLookupResult({
        ok: false,
        message: "Enter a booking or payment reference.",
      });
      return;
    }

    setCheckingStatus(true);
    try {
      const result = await lookupPublicBookingOrPaymentStatus({ data: { reference } });
      setStatusLookupResult(result);
    } catch (error) {
      console.error(error);
      setStatusLookupResult({
        ok: false,
        message: "Status could not be checked right now. Please try again.",
      });
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Tickets"
        title="Visit requests, in three considered steps."
        intro={
          paymentEnabled
            ? "Submit a visit request. Approved payment instructions are sent only after administrator review."
            : "Submit a visit request for review. Payment collection is not active yet."
        }
      />

      <section className="container-y py-16 pb-24 md:pb-16">
        {checkoutReturn.checkout ? (
          <CheckoutReturnNotice
            status={checkoutReturn.checkout}
            paymentReference={checkoutReturn.paymentReference}
            provider={checkoutReturn.provider}
          />
        ) : null}

        <StatusLookupPanel
          reference={statusReference}
          onReferenceChange={setStatusReference}
          result={statusLookupResult}
          checking={checkingStatus}
          onSubmit={() => void handleStatusLookup()}
        />

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
          <div className="border border-border bg-background p-5 sm:p-8">
            {message && step !== 4 ? (
              <p className="mb-6 rounded-sm border border-brass/30 bg-brass/10 px-3 py-2 text-sm text-forest-deep">
                {message}
              </p>
            ) : null}

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
                      value={visitDate}
                      onChange={(event) => setVisitDate(event.currentTarget.value)}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Time</span>
                    <select
                      value={visitTime}
                      onChange={(event) => setVisitTime(event.currentTarget.value)}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    >
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
                      onChange={(event) => setAdults(Math.max(0, Number(event.target.value)))}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Children</span>
                    <input
                      type="number"
                      min={0}
                      value={children}
                      onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Duration of stay</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={durationOfStayDays}
                      onChange={(event) =>
                        setDurationOfStayDays(Math.max(1, Number(event.target.value)))
                      }
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Group category</span>
                    <select
                      value={groupCategory}
                      onChange={(event) => setGroupCategory(event.currentTarget.value)}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
                    >
                      <option>Individual / family</option>
                      <option>School</option>
                      <option>Private group</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={addTourBus}
                      onChange={(event) => setAddTourBus(event.currentTarget.checked)}
                    />
                    <span className="text-sm">Add designated tour bus</span>
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-2xl text-forest-deep">Visitor details</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <TextField label="Full name" value={visitorName} onChange={setVisitorName} />
                  <TextField
                    label="Email"
                    type="email"
                    value={visitorEmail}
                    onChange={setVisitorEmail}
                  />
                  <TextField label="Phone number" type="tel" value={phone} onChange={setPhone} />
                  <TextField
                    label="Emergency contact"
                    type="tel"
                    value={emergencyContact}
                    onChange={setEmergencyContact}
                  />
                  <TextField
                    label="Country of origin"
                    value={countryOfOrigin}
                    onChange={setCountryOfOrigin}
                  />
                  <label className="block sm:col-span-2">
                    <span className="text-sm">Booking notes</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(event) => setNotes(event.currentTarget.value)}
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
                <h2 className="mt-6 font-serif text-3xl text-forest-deep">Request received</h2>
                <p className="mt-3 text-muted-foreground">
                  {message ??
                    "Your booking request has been received for review before confirmation."}
                </p>
                <div className="mx-auto mt-10 max-w-sm border border-border bg-cream p-6 text-left">
                  <p className="eyebrow">Request summary</p>
                  <p className="mt-2 font-serif text-xl text-forest-deep">
                    {selectedTicket?.label}
                  </p>
                  {bookingReference ? (
                    <p className="mt-2 text-sm font-medium text-forest-deep">
                      Reference: {bookingReference}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {adults} adults · {children} children · {durationOfStayDays} day
                    {durationOfStayDays === 1 ? "" : "s"}
                  </p>
                  <p className="mt-6 rounded-sm border border-border bg-background p-4 text-sm text-muted-foreground">
                    {paymentEnabled
                      ? "The team will review availability before sending approved payment instructions. Payment is confirmed only after provider verification."
                      : "Payment is not active for this request. The team will review availability before any confirmation or payment collection."}
                  </p>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="mt-10 flex justify-between border-t border-border pt-6">
                <button
                  disabled={step === 1 || submitting}
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  disabled={submitting || !bookingEnabled}
                  onClick={() => (step === 3 ? void handleSubmitRequest() : setStep((s) => s + 1))}
                  className="rounded-full bg-forest-deep px-6 py-2.5 text-sm text-ivory disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === 3 ? (submitting ? "Submitting" : "Submit request") : "Continue"}
                </button>
              </div>
            )}
          </div>

          <aside className="h-fit border border-border bg-cream p-6">
            <p className="eyebrow">Booking summary</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ticket</dt>
                <dd>{selectedTicket?.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adults</dt>
                <dd>{adults}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Children</dt>
                <dd>{children}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>
                  {durationOfStayDays} day{durationOfStayDays === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-serif text-lg text-forest-deep">
                <dt>Pricing</dt>
                <dd>{paymentEnabled ? "After admin review" : "Pending confirmation"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Booking requests are saved for administrator review. Payment collection is separate
              and confirmed only after provider verification.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

function StatusLookupPanel({
  reference,
  onReferenceChange,
  result,
  checking,
  onSubmit,
}: {
  reference: string;
  onReferenceChange: (value: string) => void;
  result: PublicStatusLookupResult | null;
  checking: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="mb-10 border border-border bg-background p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <p className="eyebrow">Check status</p>
          <h2 className="mt-2 font-serif text-2xl text-forest-deep">
            Booking or payment reference
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a reference to see the current review and payment status. Final payment
            confirmation depends on verified provider records.
          </p>
        </div>
        <div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Booking or payment reference</span>
              <input
                value={reference}
                onChange={(event) => onReferenceChange(event.currentTarget.value)}
                placeholder="YHP-B-... or YHP-PAY-..."
                className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={checking}
              className="rounded-full bg-forest-deep px-5 py-2.5 text-sm text-ivory disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? "Checking" : "Check status"}
            </button>
          </form>

          {result ? <StatusLookupResult result={result} /> : null}
        </div>
      </div>
    </div>
  );
}

function StatusLookupResult({ result }: { result: PublicStatusLookupResult }) {
  if (!result.ok) {
    return (
      <p className="mt-4 rounded-sm border border-brass/30 bg-brass/10 px-3 py-2 text-sm text-forest-deep">
        {result.message}
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-sm border border-forest/20 bg-forest/10 p-4 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-forest-deep">{result.statusLabel}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {result.kind === "payment" ? "Payment" : "Booking"}
        </p>
      </div>
      <p className="mt-2 text-muted-foreground">{result.detail}</p>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <StatusLookupField label="Reference" value={result.reference} />
        <StatusLookupField label="Amount" value={result.amountLabel} />
        <StatusLookupField label="Provider" value={result.providerLabel} />
        <StatusLookupField label="Verification" value={result.verificationLabel} />
        <StatusLookupField label="Latest payment" value={result.bookingReference} />
        <StatusLookupField label="Visit date" value={result.visitDateLabel} />
      </dl>
      {result.nextStep ? (
        <p className="mt-4 rounded-sm border border-border bg-background p-3 text-xs text-muted-foreground">
          {result.nextStep}
        </p>
      ) : null}
    </div>
  );
}

function StatusLookupField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-forest-deep">{value}</dd>
    </div>
  );
}

function CheckoutReturnNotice({
  status,
  paymentReference,
  provider,
}: {
  status: "success" | "cancelled";
  paymentReference?: string;
  provider?: string;
}) {
  const providerLabel = provider ? formatProvider(provider) : "the payment provider";
  const successful = status === "success";
  return (
    <div
      className={`mb-10 rounded-sm border px-5 py-4 text-sm ${
        successful
          ? "border-forest/25 bg-forest/10 text-forest-deep"
          : "border-brass/30 bg-brass/10 text-forest-deep"
      }`}
    >
      <p className="font-medium">
        {successful ? "Checkout returned for verification" : "Checkout was not completed"}
      </p>
      <p className="mt-1 text-muted-foreground">
        {successful
          ? `We received your return from ${providerLabel}. Payment confirmation is completed only after the provider webhook is verified by the administration team.`
          : `You returned from ${providerLabel} without completing checkout. No payment has been marked as received.`}
      </p>
      {paymentReference ? (
        <p className="mt-3 text-xs font-medium text-forest-deep">
          Payment reference: {paymentReference}
        </p>
      ) : null}
    </div>
  );
}

function formatProvider(value: string): string {
  if (value === "paypal") return "PayPal";
  if (value === "paystack") return "Paystack";
  if (value === "stripe") return "Stripe";
  return value;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5"
      />
    </label>
  );
}
