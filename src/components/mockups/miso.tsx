// Miso House: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.
// Food photography: free Unsplash photos, see photos/CREDITS.md.
import type { StaticImageData } from "next/image";
import { Photo } from "./frames";
import gyoza from "./photos/miso-gyoza.jpg";
import poke from "./photos/miso-poke.jpg";
import shoyu from "./photos/miso-shoyu.jpg";
import tonkotsu from "./photos/miso-tonkotsu.jpg";

const INK = "#111014";
const RED = "#d6372e";
const RICE = "#f3e9dc";

/** A dish photographed from above, cropped into a round bowl shape. */
function Dish({ src, className, position, sizes }: { src: StaticImageData; className?: string; position?: string; sizes?: string }) {
  return (
    <Photo
      src={src}
      position={position}
      sizes={sizes}
      className={`aspect-square rounded-full ${className ?? ""}`}
      style={{ boxShadow: "0 24px 50px -16px #000000cc" }}
    />
  );
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
  { n: "Tonkotsu ramen", d: "18-hour pork broth, chashu, spring onion", p: "£14.50", img: tonkotsu },
  { n: "Shoyu ramen", d: "Soy broth, ajitama egg, shiitake, nori", p: "£13.50", img: shoyu },
  { n: "Pork gyoza", d: "Crisp-bottomed, ponzu dip", p: "£7", img: gyoza },
  { n: "Salmon poke bowl", d: "Sushi rice, edamame, avocado, sesame", p: "£12.50", img: poke },
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
          <p className="text-sm tracking-[0.3em] text-white/60">RAMEN BAR · OPEN TILL MIDNIGHT</p>
          <p className="mt-4 text-7xl leading-none font-bold tracking-tight">
            Proper ramen,
            <br />
            late into the night.
          </p>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Slow-cooked broths, crisp gyoza and fresh poke bowls, with the bar open until midnight.
          </p>
          <div className="mt-8 w-96">
            <Reservation />
          </div>
        </div>
        <div className="relative h-full">
          <Dish src={tonkotsu} className="absolute top-4 right-10 w-[64%]" sizes="(min-width: 1024px) 30vw, 45vw" />
          <Dish src={gyoza} className="absolute bottom-6 left-0 w-[34%]" sizes="(min-width: 1024px) 16vw, 25vw" />
          <Dish src={poke} className="absolute right-0 bottom-0 w-[30%]" sizes="(min-width: 1024px) 14vw, 22vw" />
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
        {["Ramen", "Gyoza", "Bowls", "Drinks"].map((c, i) => (
          <span key={c} className="rounded-full px-4 py-2 whitespace-nowrap" style={i === 0 ? { background: INK, color: "white" } : { background: "white" }}>
            {c}
          </span>
        ))}
      </div>
      <div className="space-y-3 px-5">
        {MENU.map((m) => (
          <div key={m.n} className="flex items-center gap-4 rounded-2xl bg-white p-3">
            <Photo src={m.img} sizes="80px" className="aspect-square w-16 shrink-0 rounded-xl" />
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
          <div className="overflow-hidden rounded-3xl" style={{ background: "#1d1b22" }}>
            <Photo src={shoyu} sizes="(min-width: 1024px) 30vw, 50vw" position="50% 40%" className="aspect-[16/7]" />
            <div className="p-6">
              <p className="text-sm text-white/60">Tonight’s special</p>
              <p className="mt-1 font-bold">Shoyu ramen with ajitama egg</p>
              <p className="text-sm text-white/60">£13.50 · Limited to 30 bowls</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
