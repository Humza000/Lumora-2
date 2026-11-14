// Maison & Co Interiors: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.
// Product and room photography: free Unsplash photos, see photos/CREDITS.md.
import type { StaticImageData } from "next/image";
import { Photo } from "./frames";
import armchair from "./photos/maison-armchair.jpg";
import consoleTable from "./photos/maison-console.jpg";
import livingRoom from "./photos/maison-living-room.jpg";
import throwBlanket from "./photos/maison-throw.jpg";
import vase from "./photos/maison-vase.jpg";

const CREAM = "#f5f0e8";
const STONE = "#2b2621";
const CLAY = "#b07a5a";
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

const PRODUCTS: { n: string; p: string; img: StaticImageData; pos?: string }[] = [
  { n: "Lounge armchair", p: "£640", img: armchair, pos: "45% 62%" },
  { n: "Elm console table", p: "£720", img: consoleTable, pos: "40% 78%" },
  { n: "Stoneware bud vase", p: "£85", img: vase, pos: "55% 62%" },
  { n: "Chunky knit throw", p: "£120", img: throwBlanket, pos: "0% 100%" },
];

function Product({ n, p, img, pos }: (typeof PRODUCTS)[number]) {
  return (
    <div>
      <Photo src={img} position={pos} sizes="(min-width: 1024px) 14vw, 22vw" className="aspect-square rounded-sm" />
      <p className="mt-3 text-sm">{n}</p>
      <p className="text-sm opacity-60">{p}</p>
    </div>
  );
}

function Nav() {
  return (
    <div className="flex items-center justify-between px-16 py-6">
      <div className="flex gap-7 text-sm">
        <span>Living</span>
        <span>Dining</span>
        <span>Bedroom</span>
        <span>Objects</span>
      </div>
      <span className="text-2xl tracking-[0.35em]" style={SERIF}>
        MAISON & CO
      </span>
      <div className="flex gap-7 text-sm">
        <span>Journal</span>
        <span>Search</span>
        <span>Bag (2)</span>
      </div>
    </div>
  );
}

export function Desktop() {
  return (
    <div className="h-full" style={{ background: CREAM, color: STONE }}>
      <div className="py-2 text-center text-xs tracking-widest text-white" style={{ background: STONE }}>
        COMPLIMENTARY WHITE-GLOVE DELIVERY ON ORDERS OVER £250
      </div>
      <Nav />
      <div className="grid grid-cols-[1fr_1.35fr] items-center gap-12 px-16 pb-8">
        <div>
          <p className="text-xs tracking-[0.3em]" style={{ color: CLAY }}>
            THE AUTUMN EDIT
          </p>
          <p className="mt-4 text-6xl leading-[1.05]" style={SERIF}>
            Considered pieces for slower living.
          </p>
          <p className="mt-5 text-base opacity-70">
            Natural materials, made by small workshops, and chosen to last a lifetime.
          </p>
          <div className="mt-8 flex gap-4 text-sm">
            <span className="px-7 py-4 text-white" style={{ background: STONE }}>
              Shop the edit
            </span>
            <span className="border px-7 py-4" style={{ borderColor: STONE }}>
              View in your room
            </span>
          </div>
        </div>
        <Photo src={livingRoom} sizes="(min-width: 1024px) 34vw, 55vw" position="50% 62%" className="aspect-[16/10]" />
      </div>
      <div className="grid grid-cols-4 gap-6 px-16">
        {PRODUCTS.map((p) => (
          <Product key={p.n} {...p} />
        ))}
      </div>
    </div>
  );
}

export function Mobile() {
  return (
    <div className="flex h-full flex-col pt-10" style={{ background: CREAM, color: STONE }}>
      <div className="flex items-center justify-between px-5 py-4 text-sm">
        <span>☰</span>
        <span className="text-lg tracking-[0.3em]" style={SERIF}>
          MAISON & CO
        </span>
        <span>Bag</span>
      </div>
      <Photo src={armchair} sizes="(min-width: 1024px) 18vw, 45vw" position="50% 55%" className="mx-5 aspect-square" />
      <div className="flex justify-center gap-2 py-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i === 0 ? STONE : "#cfc4b4" }} />
        ))}
      </div>
      <div className="px-5">
        <p className="text-2xl" style={SERIF}>
          Lounge armchair
        </p>
        <p className="mt-1 opacity-70">£640 · Grey linen, solid oak legs</p>
        <div className="mt-4 flex gap-2">
          {["#9a9690", "#e8dccb", "#4f5c43"].map((c, i) => (
            <span key={c} className="h-7 w-7 rounded-full" style={{ background: c, boxShadow: i === 0 ? `0 0 0 2px ${CREAM}, 0 0 0 3px ${STONE}` : undefined }} />
          ))}
        </div>
        <span className="mt-5 block border py-3 text-center text-sm" style={{ borderColor: STONE }}>
          ◎ View in your room
        </span>
        <span className="mt-3 block py-3 text-center text-sm text-white" style={{ background: STONE }}>
          Add to bag
        </span>
        <p className="mt-4 text-xs opacity-60">Made to order in Somerset · Delivered in 3–4 weeks</p>
      </div>
    </div>
  );
}

/** Signature screen: "view in your room" with the checkout drawer open. */
export function Detail() {
  return (
    <div className="relative h-full" style={{ color: STONE }}>
      <Photo src={armchair} sizes="(min-width: 1024px) 45vw, 70vw" position="45% 60%" className="absolute inset-y-0 right-96 left-0" />
      <div className="absolute top-8 left-10 rounded-full bg-white/85 px-5 py-2.5 text-sm backdrop-blur">
        ◎ View in your room · Move your phone to place the chair
      </div>
      <div className="absolute bottom-10 left-10 flex gap-3">
        {["Grey", "Oat", "Sage"].map((c, i) => (
          <span key={c} className={`rounded-full px-5 py-2.5 text-sm ${i === 0 ? "text-white" : "bg-white/85"}`} style={i === 0 ? { background: STONE } : undefined}>
            {c}
          </span>
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 flex w-96 flex-col p-8 shadow-2xl" style={{ background: CREAM }}>
        <p className="text-2xl" style={SERIF}>
          Your bag
        </p>
        <div className="mt-6 space-y-5">
          {PRODUCTS.slice(0, 2).map((p) => (
            <div key={p.n} className="flex gap-4">
              <Photo src={p.img} position={p.pos} sizes="80px" className="h-20 w-16 shrink-0 rounded-sm" />
              <div className="text-sm">
                <p>{p.n}</p>
                <p className="opacity-60">Qty 1</p>
                <p className="mt-1">{p.p}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-2 border-t pt-5 text-sm" style={{ borderColor: "#d8ccb8" }}>
          <div className="flex justify-between">
            <span className="opacity-60">Subtotal</span>
            <span>£1,360</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">White-glove delivery</span>
            <span>Free</span>
          </div>
          <span className="mt-4 block py-4 text-center text-white" style={{ background: STONE }}>
            Checkout securely
          </span>
          <p className="text-center text-xs opacity-60">Apple Pay · Klarna · Card</p>
        </div>
      </div>
    </div>
  );
}
