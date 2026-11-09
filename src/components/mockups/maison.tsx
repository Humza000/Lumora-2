// Maison & Co Interiors: client brand colours (not the Lumora theme).
// Designed at 1280px (desktop) / 390px (mobile); see `mock-desktop` in globals.css.

const CREAM = "#f5f0e8";
const STONE = "#2b2621";
const CLAY = "#b07a5a";
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

/** Illustrated room: wall, window light, sofa, lamp, plant. */
function Room({ withChair }: { withChair?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#e9e1d4 0%,#e2d7c6 68%,#cdbca5 68%,#c4b29a 100%)" }}>
      <div className="absolute top-[12%] left-[10%] h-[40%] w-[24%] rounded-t-full" style={{ background: "linear-gradient(180deg,#faf6ee,#efe6d6)" }} />
      <div className="absolute top-[18%] right-[14%] h-[26%] w-[18%] rounded-sm border-4 border-[#d8ccb8]" style={{ background: "linear-gradient(135deg,#c9b79d,#a88e6e)" }} />
      <div className="absolute bottom-[26%] left-[30%] h-[18%] w-[44%] rounded-t-3xl" style={{ background: "#8a7a68" }} />
      <div className="absolute bottom-[22%] left-[28%] h-[10%] w-[48%] rounded-2xl" style={{ background: "#9c8b77" }} />
      <div className="absolute bottom-[30%] left-[34%] h-[9%] w-[12%] rounded-xl" style={{ background: "#d9cbb6" }} />
      <div className="absolute right-[10%] bottom-[22%] h-[44%] w-1" style={{ background: STONE }} />
      <div className="absolute right-[7%] bottom-[60%] h-[10%] w-[7%] rounded-t-full" style={{ background: "#efe2c8" }} />
      <div className="absolute bottom-[22%] left-[8%] h-[24%] w-[10%] rounded-full" style={{ background: "radial-gradient(circle at 40% 35%,#7d8a6a,#4f5c43)" }} />
      {withChair && (
        <div className="absolute bottom-[18%] left-[60%] h-[26%] w-[18%]">
          <div className="absolute inset-x-0 bottom-0 h-[55%] rounded-2xl" style={{ background: "#e8dccb", boxShadow: "0 0 0 3px #ffffffaa" }} />
          <div className="absolute inset-x-[8%] top-0 h-[60%] rounded-t-3xl" style={{ background: "#efe5d6", boxShadow: "0 0 0 3px #ffffffaa" }} />
        </div>
      )}
    </div>
  );
}

const PRODUCTS = [
  { n: "Linen lounge chair", p: "£640", c: "#e8dccb" },
  { n: "Travertine side table", p: "£380", c: "#d9c9b0" },
  { n: "Hand-thrown vase", p: "£85", c: "#c9a98b" },
  { n: "Merino wool throw", p: "£120", c: "#b9a48a" },
];

function Product({ n, p, c }: { n: string; p: string; c: string }) {
  return (
    <div>
      <div className="flex aspect-[4/5] items-center justify-center rounded-sm" style={{ background: "#ece5d9" }}>
        <div className="h-[48%] w-[56%] rounded-t-[40%] rounded-b-md" style={{ background: c }} />
      </div>
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
      <div className="grid grid-cols-[1fr_1.35fr] items-center gap-12 px-16 pb-10">
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
        <div className="aspect-[4/3]">
          <Room withChair />
        </div>
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
      <div className="mx-5 flex aspect-square items-center justify-center" style={{ background: "#ece5d9" }}>
        <div className="h-[46%] w-[54%] rounded-t-[40%] rounded-b-md" style={{ background: "#e8dccb", boxShadow: "0 30px 40px -25px #00000040" }} />
      </div>
      <div className="flex justify-center gap-2 py-3">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i === 0 ? STONE : "#cfc4b4" }} />
        ))}
      </div>
      <div className="px-5">
        <p className="text-2xl" style={SERIF}>
          Linen lounge chair
        </p>
        <p className="mt-1 opacity-70">£640 · Oat linen, solid oak</p>
        <div className="mt-4 flex gap-2">
          {["#e8dccb", "#9c8b77", "#4f5c43"].map((c, i) => (
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

/** Signature screen: AR "view in your room" with the checkout drawer open. */
export function Detail() {
  return (
    <div className="relative h-full" style={{ color: STONE }}>
      <Room withChair />
      <div className="absolute top-8 left-10 rounded-full bg-white/85 px-5 py-2.5 text-sm backdrop-blur">
        ◎ View in your room · Move your phone to place the chair
      </div>
      <div className="absolute bottom-10 left-10 flex gap-3">
        {["Oat", "Walnut", "Sage"].map((c, i) => (
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
              <div className="h-20 w-16 rounded-sm" style={{ background: p.c }} />
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
            <span>£1,020</span>
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
