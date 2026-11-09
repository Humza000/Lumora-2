// Northline Plumbing & Heating: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.

const NAVY = "#0f2a44";
const ORANGE = "#f97316";

function Drop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.5c-.4 0-.8.2-1 .6C8.4 7 5 11.3 5 15a7 7 0 0014 0c0-3.7-3.4-8-6-11.9-.2-.4-.6-.6-1-.6z" />
    </svg>
  );
}

function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: ORANGE }}>
        <Drop className="h-5 w-5 text-white" />
      </span>
      <span className={`font-extrabold tracking-tight ${light ? "text-white" : ""}`} style={light ? undefined : { color: NAVY }}>
        NORTHLINE
        <span className="block text-xs font-semibold tracking-widest opacity-70">PLUMBING & HEATING</span>
      </span>
    </div>
  );
}

function Stars() {
  return <span style={{ color: "#fbbf24" }}>★★★★★</span>;
}

const SERVICES = [
  { t: "Boiler repairs", d: "Same-day fixes on all major brands" },
  { t: "Emergency leaks", d: "On site within the hour, 24/7" },
  { t: "Bathroom installs", d: "Design to finish, one team" },
  { t: "Central heating", d: "Power flushes & radiators" },
];

function QuoteCard({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-2xl" style={{ color: NAVY }}>
      <p className="text-xs font-bold tracking-widest" style={{ color: ORANGE }}>
        INSTANT QUOTE
      </p>
      <p className="mt-1 text-xl font-extrabold">What do you need?</p>
      <div className="mt-4 space-y-3 text-sm">
        {[
          ["Job", "Annual boiler service"],
          ["Property", "3-bed house"],
          ["When", "This week"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold">{v} ▾</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500">Fixed price</p>
          <p className="text-4xl font-extrabold">£89</p>
        </div>
        <span className="rounded-lg px-4 py-3 text-sm font-bold text-white" style={{ background: ORANGE }}>
          {compact ? "Book" : "Book this slot →"}
        </span>
      </div>
    </div>
  );
}

export function Desktop() {
  return (
    <div className="h-full bg-slate-50 font-sans">
      <div className="flex items-center justify-center gap-3 py-2 text-sm font-semibold text-white" style={{ background: ORANGE }}>
        ⚡ 24/7 emergency call-out across Manchester & Salford: 0161 496 0731
      </div>
      <div className="flex items-center justify-between bg-white px-16 py-5 shadow-sm">
        <Logo />
        <div className="flex gap-8 text-sm font-medium text-slate-600">
          <span>Services</span>
          <span>Areas</span>
          <span>Reviews</span>
          <span>About</span>
        </div>
        <span className="rounded-lg px-5 py-3 text-sm font-bold text-white" style={{ background: NAVY }}>
          Get an instant quote
        </span>
      </div>

      <div className="relative overflow-hidden px-16 py-14" style={{ background: NAVY }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20" style={{ background: ORANGE }} />
        <div className="absolute right-80 -bottom-32 h-72 w-72 rounded-full bg-white opacity-5" />
        <div className="relative grid grid-cols-[1.25fr_1fr] items-center gap-14">
          <div className="text-white">
            <p className="text-sm font-bold tracking-widest" style={{ color: ORANGE }}>
              GAS SAFE REGISTERED · FAMILY RUN SINCE 2009
            </p>
            <p className="mt-4 text-6xl leading-none font-extrabold tracking-tight">
              Plumbing & heating you can count on, day or night.
            </p>
            <p className="mt-5 text-lg text-slate-300">
              Fixed prices before we start, engineers on time, and no mess left behind.
            </p>
            <div className="mt-8 flex gap-4">
              <span className="rounded-lg px-6 py-4 font-bold" style={{ background: ORANGE }}>
                📞 Call an engineer now
              </span>
              <span className="rounded-lg border border-white/30 px-6 py-4 font-bold">See our prices</span>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <Stars /> Rated 4.9 by local customers
            </div>
          </div>
          <QuoteCard />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 px-16 py-10">
        {SERVICES.map((s) => (
          <div key={s.t} className="rounded-xl bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${ORANGE}1f`, color: ORANGE }}>
              <Drop className="h-5 w-5" />
            </span>
            <p className="mt-3 font-bold" style={{ color: NAVY }}>
              {s.t}
            </p>
            <p className="mt-1 text-sm text-slate-500">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Mobile() {
  return (
    <div className="flex h-full flex-col bg-slate-50 pt-10">
      <div className="flex items-center justify-between bg-white px-5 py-4">
        <Logo />
        <span className="text-2xl" style={{ color: NAVY }}>
          ☰
        </span>
      </div>
      <div className="px-5 pt-6 pb-8 text-white" style={{ background: NAVY }}>
        <p className="text-xs font-bold tracking-widest" style={{ color: ORANGE }}>
          24/7 EMERGENCY CALL-OUT
        </p>
        <p className="mt-2 text-4xl leading-tight font-extrabold">Plumbing & heating you can count on.</p>
        <div className="mt-3 text-sm text-slate-300">
          <Stars /> 4.9 from local customers
        </div>
      </div>
      <div className="-mt-4 px-5">
        <QuoteCard compact />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {SERVICES.map((s) => (
          <div key={s.t} className="rounded-xl bg-white p-4 shadow-sm">
            <Drop className="h-5 w-5" />
            <p className="mt-2 text-sm font-bold" style={{ color: NAVY }}>
              {s.t}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex gap-3 border-t border-slate-200 bg-white p-4">
        <span className="flex-1 rounded-lg py-3 text-center font-bold text-white" style={{ background: ORANGE }}>
          📞 Call now
        </span>
        <span className="flex-1 rounded-lg py-3 text-center font-bold text-white" style={{ background: NAVY }}>
          Quote
        </span>
      </div>
    </div>
  );
}

/** Signature screen: the 3-step instant-quote calculator. */
export function Detail() {
  const steps = ["Your job", "Your property", "Pick a time"];
  return (
    <div className="h-full bg-slate-100 px-16 py-12" style={{ color: NAVY }}>
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-sm text-slate-500">Secure booking · No call-out fee</span>
      </div>
      <div className="mt-10 grid grid-cols-[1.6fr_1fr] gap-8">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex gap-3">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  style={i === 0 ? { background: ORANGE, color: "white" } : { background: "#e2e8f0" }}
                >
                  {i + 1}
                </span>
                <span className={`text-sm font-semibold ${i === 0 ? "" : "text-slate-400"}`}>{s}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-3xl font-extrabold">What can we help with?</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {["Boiler service", "Boiler repair", "Leak / burst pipe", "New radiator", "Bathroom fit", "Power flush"].map((j, i) => (
              <div
                key={j}
                className="rounded-xl border-2 p-5"
                style={i === 0 ? { borderColor: ORANGE, background: `${ORANGE}12` } : { borderColor: "#e2e8f0" }}
              >
                <Drop className="h-6 w-6" />
                <p className="mt-3 font-bold">{j}</p>
                <p className="text-sm text-slate-500">{i === 0 ? "from £89" : i === 2 ? "from £120" : "from £95"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl p-7 text-white" style={{ background: NAVY }}>
            <p className="text-sm text-slate-300">Your quote</p>
            <p className="mt-1 text-5xl font-extrabold">£89</p>
            <p className="mt-1 text-sm text-slate-300">Annual boiler service · fixed price</p>
            <div className="mt-6 space-y-2 text-sm">
              {["Gas Safe engineer", "Safety certificate included", "12-month guarantee"].map((x) => (
                <p key={x}>
                  <span style={{ color: ORANGE }}>✓</span> {x}
                </p>
              ))}
            </div>
            <span className="mt-6 block rounded-lg py-3 text-center font-bold" style={{ background: ORANGE }}>
              Continue →
            </span>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Stars />
            <p className="mt-2 text-sm text-slate-600">“Booked online at 9pm, engineer arrived first thing.”</p>
            <p className="mt-2 text-xs text-slate-400">Example review card</p>
          </div>
        </div>
      </div>
    </div>
  );
}
