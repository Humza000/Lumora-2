// Northline Plumbing & Heating: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.
// Photography: free Unsplash photos, see photos/CREDITS.md.
import type { StaticImageData } from "next/image";
import { Photo } from "./frames";
import bathroom from "./photos/northline-bathroom.jpg";
import bathroomInstall from "./photos/northline-bathroom-install.jpg";
import boiler from "./photos/northline-boiler.jpg";
import engineer from "./photos/northline-engineer.jpg";
import leak from "./photos/northline-leak.jpg";
import radiator from "./photos/northline-radiator.jpg";
import tools from "./photos/northline-tools.jpg";

const NAVY = "#0f2a44";
const NAVY_DEEP = "#0a1d30";
const ORANGE = "#f97316";

function Drop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.5c-.4 0-.8.2-1 .6C8.4 7 5 11.3 5 15a7 7 0 0014 0c0-3.7-3.4-8-6-11.9-.2-.4-.6-.6-1-.6z" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M10 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm4 6.3l-4.8 5.2a.8.8 0 01-1.2 0L6 10.8a.8.8 0 111.2-1.1l1.4 1.5 4.2-4.5A.8.8 0 0114 7.8z" />
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

const SERVICES: { t: string; d: string; img: StaticImageData; pos?: string }[] = [
  { t: "Boiler repairs", d: "Same-day fixes on all major brands", img: boiler, pos: "45% 40%" },
  { t: "Emergency leaks", d: "On site within the hour, 24/7", img: leak, pos: "50% 45%" },
  { t: "Bathroom installs", d: "Design to finish, one team", img: bathroomInstall, pos: "50% 30%" },
  { t: "Central heating", d: "Power flushes & radiators", img: radiator, pos: "60% 70%" },
];

const TRUST = ["Gas Safe registered", "Fixed prices up front", "No call-out fee"];

function QuoteCard({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-2xl" style={{ color: NAVY }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest" style={{ color: ORANGE }}>
          INSTANT QUOTE
        </p>
        {!compact && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 3 engineers free today
          </span>
        )}
      </div>
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

      {/* Hero: engineer photo with a navy fade so the copy stays readable */}
      <div className="relative overflow-hidden px-16 py-12">
        <Photo src={engineer} sizes="(min-width: 1024px) 60vw, 90vw" position="70% 40%" className="absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY}f2 38%, ${NAVY}99 62%, ${NAVY}26 100%)` }}
        />
        <div className="relative grid grid-cols-[1.25fr_1fr] items-center gap-14">
          <div className="text-white">
            <p className="text-sm font-bold tracking-widest" style={{ color: ORANGE }}>
              FAMILY RUN SINCE 2009 · MANCHESTER & SALFORD
            </p>
            <p className="mt-4 text-6xl leading-none font-extrabold tracking-tight">
              Plumbing & heating you can count on, day or night.
            </p>
            <p className="mt-5 text-lg text-slate-200">Fixed prices before we start, engineers on time, and no mess left behind.</p>
            <div className="mt-7 flex gap-4">
              <span className="rounded-lg px-6 py-4 font-bold shadow-lg" style={{ background: ORANGE }}>
                📞 Call an engineer now
              </span>
              <span className="rounded-lg border border-white/40 bg-white/10 px-6 py-4 font-bold backdrop-blur">See our prices</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-100">
              {TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-orange-400" /> {t}
                </span>
              ))}
            </div>
          </div>
          <QuoteCard />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 px-16 py-8">
        {SERVICES.map((s) => (
          <div key={s.t} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <Photo src={s.img} position={s.pos} sizes="(min-width: 1024px) 15vw, 24vw" className="h-28" />
            <div className="p-4">
              <p className="font-bold" style={{ color: NAVY }}>
                {s.t}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{s.d}</p>
            </div>
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
      <div className="relative shrink-0 overflow-hidden px-5 pt-5 pb-9 text-white">
        <Photo src={engineer} sizes="(min-width: 1024px) 20vw, 50vw" position="78% 40%" className="absolute inset-0" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${NAVY}cc 0%, ${NAVY_DEEP}f5 100%)` }} />
        <div className="relative">
          <p className="text-xs font-bold tracking-widest" style={{ color: ORANGE }}>
            24/7 EMERGENCY CALL-OUT
          </p>
          <p className="mt-2 text-3xl leading-tight font-extrabold">Plumbing & heating you can count on.</p>
          <div className="mt-3 text-sm text-slate-200">
            <Stars /> 4.9 from local customers
          </div>
        </div>
      </div>
      <div className="-mt-5 shrink-0 px-5">
        <QuoteCard compact />
      </div>
      {/* One row on the phone so the call bar stays on screen */}
      <div className="mt-4 grid shrink-0 grid-cols-2 gap-3 px-5">
        {SERVICES.slice(0, 2).map((s) => (
          <div key={s.t} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <Photo src={s.img} position={s.pos} sizes="(min-width: 1024px) 9vw, 22vw" className="h-14" />
            <p className="px-3 py-1.5 text-sm font-bold" style={{ color: NAVY }}>
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

const JOBS: { j: string; from: string; img: StaticImageData; pos?: string }[] = [
  { j: "Boiler service", from: "from £89", img: boiler, pos: "45% 40%" },
  { j: "Boiler repair", from: "from £95", img: tools, pos: "45% 50%" },
  { j: "Leak / burst pipe", from: "from £120", img: leak, pos: "50% 45%" },
  { j: "New radiator", from: "from £95", img: radiator, pos: "60% 70%" },
  { j: "Bathroom fit", from: "free survey", img: bathroom, pos: "50% 55%" },
  { j: "Power flush", from: "from £95", img: engineer, pos: "35% 60%" },
];

/** Signature screen: the 3-step instant-quote calculator. */
export function Detail() {
  const steps = ["Your job", "Your property", "Pick a time"];
  return (
    <div className="h-full bg-slate-100 px-16 py-10" style={{ color: NAVY }}>
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-sm text-slate-500">Secure booking · No call-out fee</span>
      </div>
      <div className="mt-8 grid grid-cols-[1.6fr_1fr] gap-8">
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
          <p className="mt-6 text-3xl font-extrabold">What can we help with?</p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {JOBS.map((job, i) => (
              <div
                key={job.j}
                className="overflow-hidden rounded-xl border-2"
                style={i === 0 ? { borderColor: ORANGE, background: `${ORANGE}12` } : { borderColor: "#e2e8f0" }}
              >
                <Photo src={job.img} position={job.pos} sizes="(min-width: 1024px) 10vw, 18vw" className="h-20" />
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-bold">{job.j}</p>
                    <p className="text-xs text-slate-500">{job.from}</p>
                  </div>
                  {i === 0 && <Check className="h-5 w-5 shrink-0 text-orange-500" />}
                </div>
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
