import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, MapPin, Clock, User, Ticket } from "lucide-react";

type Status = "New" | "Acknowledged" | "Dispatched" | "On Scene" | "Resolved";

const ALERTS: {
  id: string;
  name: string;
  ref: string;
  cat: string;
  loc: string;
  accuracy: string;
  time: string;
  officer: string;
  status: Status;
}[] = [
  {
    id: "4021",
    name: "A. Ogunleye",
    ref: "YHP-2026-0421",
    cat: "Medical emergency",
    loc: "Sector B · Nature Trail 2",
    accuracy: "±6 m",
    time: "2 min ago",
    officer: "—",
    status: "New",
  },
  {
    id: "4018",
    name: "K. Adio",
    ref: "YHP-2026-0388",
    cat: "Lost or separated",
    loc: "Sector A · Cultural Grounds",
    accuracy: "±12 m",
    time: "18 min ago",
    officer: "Officer Balogun",
    status: "Dispatched",
  },
  {
    id: "4011",
    name: "T. Sanni",
    ref: "YHP-2026-0355",
    cat: "Accident or injury",
    loc: "Sector C · Event Lawn",
    accuracy: "±4 m",
    time: "1 h ago",
    officer: "Officer Salako",
    status: "On Scene",
  },
];

export const Route = createFileRoute("/admin/sos")({
  component: AdminSOS,
});

function AdminSOS() {
  const [selected, setSelected] = useState(ALERTS[0]);
  const [status, setStatus] = useState<Status>(selected.status);

  const pill = (s: Status) => {
    const map: Record<Status, string> = {
      New: "bg-destructive text-ivory",
      Acknowledged: "bg-clay text-ivory",
      Dispatched: "bg-brass text-charcoal",
      "On Scene": "bg-moss text-ivory",
      Resolved: "bg-forest text-ivory",
    };
    return `rounded-full px-2 py-0.5 text-[10px] font-medium ${map[s]}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Safety operations</p>
          <h1 className="mt-2 font-serif text-3xl text-forest-deep">SOS alerts</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <ShieldAlert className="size-3.5" />
          {ALERTS.filter((a) => a.status === "New").length} new
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-sm border border-border bg-background">
          <div className="border-b border-border p-4 text-xs text-muted-foreground">Live queue</div>
          <ul>
            {ALERTS.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => {
                    setSelected(a);
                    setStatus(a.status);
                  }}
                  className={`flex w-full flex-col gap-1 border-b border-border p-4 text-left text-sm transition ${
                    selected.id === a.id ? "bg-cream" : "hover:bg-cream/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-forest-deep">{a.name}</span>
                    <span className={pill(a.status)}>{a.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.cat} · {a.time}
                  </span>
                  <span className="text-xs text-muted-foreground">{a.loc}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-sm border border-border bg-background p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="eyebrow">Active alert #{selected.id}</p>
              <h2 className="mt-2 font-serif text-2xl text-forest-deep">{selected.cat}</h2>
            </div>
            <span className={pill(status)}>{status}</span>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <Info icon={User} label="Visitor" value={selected.name} />
            <Info icon={Ticket} label="Ticket reference" value={selected.ref} />
            <Info icon={MapPin} label="Location" value={selected.loc} />
            <Info icon={MapPin} label="GPS accuracy" value={selected.accuracy} />
            <Info icon={Clock} label="Time received" value={selected.time} />
            <Info icon={User} label="Assigned officer" value={selected.officer} />
          </div>

          <div className="mt-6 aspect-[16/8] w-full overflow-hidden rounded-sm border border-border bg-[oklch(0.94_0.02_140)]">
            <svg viewBox="0 0 600 300" className="size-full" aria-hidden>
              <defs>
                <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="oklch(0.88 0.03 140)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="600" height="300" fill="url(#g)" />
              <circle cx="360" cy="150" r="24" fill="oklch(0.52 0.19 25 / 0.25)" />
              <circle cx="360" cy="150" r="6" fill="oklch(0.52 0.19 25)" />
            </svg>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["Acknowledged", "Dispatched", "On Scene", "Resolved"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full border px-4 py-2 text-xs ${
                  status === s
                    ? "border-forest-deep bg-forest-deep text-ivory"
                    : "border-border hover:border-forest"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Add notes
              </span>
              <textarea
                rows={3}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="Radio update, patient condition, further actions..."
              />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 font-serif text-lg text-forest-deep">{value}</p>
    </div>
  );
}
