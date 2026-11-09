// Miso House: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.

const INK = "#111014";
const RED = "#d6372e";
const RICE = "#f3e9dc";

/** Illustrated bowl seen from above. */
function Bowl({ className, tone = "ramen" }: { className?: string; tone?: "ramen" | "poke" | "gyoza" }) {
  const fill = {
    ramen: "radial-gradient(circle at 50% 50%,#f0c27b 0 30%,#d8963d 31% 55%,#2a1d14 56% 62%,#1b1512 63%)",
    poke: "radial-gradient(circle at 50% 50%,#f4f0e6 0 28%,#e2725b 29% 45%,#7fae5a 46% 58%,#1b1512 59%)",
    gyoza: "radial-gradient(circle at 50% 50%,#e8c79a 0 40%,#c58d4f 41% 55%,#1b1512 56%)",
  }[tone];
  return <div className={`aspect-square rounded-full ${className ?? ""}`} style={{ background: fill, boxShadow: "0 20px 40px -12px #000000aa" }} />;
}

function Logo({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-8 rounded-full" style={{ background: RED }} />
      <span className={`text-xl font-bold tracking-[0.25em] ${dark ? "" : "text-white"}`}>MISO HOUSE</span>
    </div>
  );
}

const MENU = [
  { n: "Tonkotsu ramen", d: "18-hour pork broth, chashu, ajitama", p: "£14.50" },
  { n: "Spicy miso ramen", d: "Red miso, chilli oil, bean sprouts", p: "£14" },
  { n: "Pork & chive gyoza", d: "Crisp-bottomed, ponzu dip", p: "£7" },
  { n: "Salmon poke bowl", d: "Sushi rice, edamame, sesame", p: "£12.50" },
];

function Reservation({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: RICE, color: INK }}>
      <p className="text-xs font-bold tracking-widest" style={{ color: RED }}>
        BOOK A TABLE
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white px-3 py-2.5">
          <span className="block text-xs opacity-50">Date</span>Fri 14 Nov
        </div>
        <div className="rounded-lg bg-white px-3 py-2.5">
          <span className="block text-xs opacity-50">Guests</span>4 people
        </div>
      </div>
      <div className={`mt-4 grid gap-2 text-sm ${compact ? "grid-cols-3" : "grid-cols-4"}`}>
        {["18:00", "18:30", "19:15", "20:00", "20:45", "21:15"].slice(0, compact ? 6 : 4).map((t, i) => (
          <span
            key={t}
            className="rounded-lg py-2 text-center font-semibold"
            style={i === 2 ? { background: RED, color: "white" } : { background: "white" }}
          >
            {t}
          </span>
        ))}
      </div>
      <span className="mt-4 block rounded-lg py-3 text-center font-bold text-white" style={{ background: INK }}>
        Reserve 19:15 →
      </span>
    </div>
  );
}

export function Desktop() {
  return (
    <div className="relative h-full overflow-hidden text-white" style={{ background: INK }}>
      <div className="absolute top-[-20%] right-[-6%] h-[90%] w-[52%] rounded-full opacity-90" style={{ background: RED }} />
      <div className="relative flex items-center justify-between px-16 py-6">
        <Logo />
        <div className="flex gap-8 text-sm text-white/70">
          <span>Menu</span>
          <span>Takeaway</span>
          <span>Miso Club</span>
          <span>Find us</span>
        </div>
        <span className="rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: RICE, color: INK }}>
          Book a table
        </span>
      </div>
      <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-10 px-16 pt-8">
        <div>
          <p className="text-sm tracking-[0.3em] text-white/60">LEEDS · CALL LANE</p>
          <p className="mt-4 text-7xl leading-none font-bold tracking-tight">
            Modern Japanese,
            <br />
            made to share.
          </p>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Slow-cooked ramen, robata grill and small plates, with a late bar until midnight.
          </p>
          <div className="mt-8 w-96">
            <Reservation />
          </div>
        </div>
        <div className="relative h-full">
          <Bowl className="absolute top-4 right-10 w-[64%]" />
          <Bowl tone="gyoza" className="absolute bottom-6 left-0 w-[34%]" />
          <Bowl tone="poke" className="absolute right-0 bottom-0 w-[30%]" />
        </div>
      </div>
    </div>
  );
}

export function Mobile() {
  return (
    <div className="flex h-full flex-col pt-10" style={{ background: RICE, color: INK }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ background: INK }}>
        <Logo />
        <span className="text-white">☰</span>
      </div>
      <div className="flex gap-2 overflow-hidden px-5 py-4 text-sm font-semibold">
        {["Ramen", "Small plates", "Robata", "Sushi"].map((c, i) => (
          <span key={c} className="rounded-full px-4 py-2 whitespace-nowrap" style={i === 0 ? { background: INK, color: "white" } : { background: "white" }}>
            {c}
          </span>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {MENU.map((m, i) => (
          <div key={m.n} className="flex items-center gap-4 rounded-2xl bg-white p-3">
            <Bowl tone={i === 2 ? "gyoza" : i === 3 ? "poke" : "ramen"} className="w-16 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">{m.n}</p>
              <p className="text-xs opacity-60">{m.d}</p>
            </div>
            <span className="font-bold">{m.p}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto p-4">
        <span className="block rounded-full py-3.5 text-center font-bold text-white" style={{ background: RED }}>
          Book a table
        </span>
      </div>
    </div>
  );
}

/** Signature screen: reservation flow + Miso Club loyalty card. */
export function Detail() {
  return (
    <div className="h-full px-16 py-12 text-white" style={{ background: INK }}>
      <Logo />
      <div className="mt-10 grid grid-cols-[1.2fr_1fr] gap-10">
        <div>
          <p className="text-5xl font-bold">Book your table</p>
          <p className="mt-2 text-white/60">Instant confirmation · Deposit-free for up to 6 guests</p>
          <div className="mt-8 w-full">
            <Reservation compact />
          </div>
        </div>
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: `linear-gradient(135deg, ${RED}, #8f1d17)` }}>
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
            <p className="text-sm tracking-[0.3em] text-white/80">MISO CLUB</p>
            <p className="mt-2 text-3xl font-bold">7 of 10 bowls</p>
            <div className="mt-5 grid grid-cols-10 gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="aspect-square rounded-full" style={{ background: i < 7 ? RICE : "#ffffff33" }} />
              ))}
            </div>
            <p className="mt-4 text-sm text-white/80">3 more for a free bowl of ramen</p>
          </div>
          <div className="rounded-3xl p-6" style={{ background: "#1d1b22" }}>
            <p className="text-sm text-white/60">Tonight’s special</p>
            <div className="mt-3 flex items-center gap-4">
              <Bowl className="w-20" />
              <div>
                <p className="font-bold">Black garlic tonkotsu</p>
                <p className="text-sm text-white/60">£15.50 · Limited to 30 bowls</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
