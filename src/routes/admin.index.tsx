import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Ticket, Users, Calendar, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

const stats = [
  { label: "Today's visitors", value: "482", delta: "+6%" },
  { label: "Upcoming bookings", value: "128", delta: "+12%" },
  { label: "Ticket sales (7d)", value: "₦1.2M", delta: "+3%" },
  { label: "Pending enquiries", value: "17", delta: "—" },
];

function AdminHome() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 font-serif text-3xl text-forest-deep">Dashboard</h1>
        </div>
        <div className="text-xs text-muted-foreground">Last synced 2 minutes ago · Mock data</div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-sm border border-border bg-background p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-serif text-3xl text-forest-deep">{s.value}</p>
            <p className="mt-2 text-xs text-clay">{s.delta}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-border bg-background p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest-deep">Upcoming events</h2>
            <Link to="/admin" className="text-xs text-clay">
              View all →
            </Link>
          </div>
          <table className="mt-6 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="pb-3">Event</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Bookings</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Daily Cultural Tour", "Today · 10:00", "24 / 30", "Open"],
                ["Morning Prayer Walk", "Tomorrow · 06:30", "12 / 15", "Limited"],
                ["Hunters with Baba Olóde", "Sat · 06:00", "8 / 10", "Limited"],
                ["Craft Workshop", "Sat · 11:00", "14 / 25", "Open"],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-border/60">
                  <td className="py-3 font-medium">{r[0]}</td>
                  <td className="py-3 text-muted-foreground">{r[1]}</td>
                  <td className="py-3">{r[2]}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs">{r[3]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-sm border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-4" />
            <h2 className="font-serif text-lg">Active SOS alerts</h2>
          </div>
          <p className="mt-3 text-3xl font-serif text-destructive">1</p>
          <p className="text-xs text-muted-foreground">Requires acknowledgement</p>
          <Link
            to="/admin/sos"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-destructive px-4 py-2 text-xs text-ivory"
          >
            Open SOS console <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-background p-6">
          <h2 className="font-serif text-xl text-forest-deep">Pending enquiries</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {[
              ["Ceremony · Wedding", "M. Adebayo", "2h ago"],
              ["Oríkì consultation", "T. Ogun", "5h ago"],
              ["School group visit", "Green Field School", "1d ago"],
              ["Stay & Own · Iroko", "K. Balogun", "2d ago"],
            ].map((r, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{r[0]}</p>
                  <p className="text-xs text-muted-foreground">{r[1]}</p>
                </div>
                <span className="text-xs text-muted-foreground">{r[2]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-border bg-background p-6">
          <h2 className="font-serif text-xl text-forest-deep">Recent admin activity</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {[
              ["A. Salako", "Published event: Craft Workshop", "10m ago"],
              ["O. Fadeyi", "Acknowledged SOS #4021", "1h ago"],
              ["B. Ige", "Updated Discover page", "3h ago"],
              ["System", "Nightly backup completed", "Overnight"],
            ].map((r, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{r[0]}</p>
                  <p className="text-xs text-muted-foreground">{r[1]}</p>
                </div>
                <span className="text-xs text-muted-foreground">{r[2]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
