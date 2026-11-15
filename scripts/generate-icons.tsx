// Generates every tab/app icon: a white Cormorant Garamond "L" on a purple gradient tile.
// Run with `npm run icons` and commit the output. It is not part of the build.
// Brand hex values are a deliberate copy (like emails and the invoice PDF): #8B5CF6 brand, #4C1D95 brand-deep, #DDD6FE brand-tint.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const root = process.cwd(); // run from the repo root (npm run icons)

/** rounded: transparent rounded corners (browser tabs). Otherwise a full-bleed square (iOS/Android mask it). */
function Monogram({ size, rounded, dots }: { size: number; rounded: boolean; dots: boolean }) {
  const dot = Math.max(2, size * 0.022);
  const inset = size * 0.16;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderRadius: rounded ? size * 0.22 : 0,
        background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 55%, #4C1D95 100%)",
      }}
    >
      {dots &&
        [
          [inset, inset],
          [size - inset, inset],
          [inset, size - inset],
          [size - inset, size - inset],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - dot / 2,
              top: y - dot / 2,
              width: dot,
              height: dot,
              borderRadius: dot,
              background: "rgba(221, 214, 254, 0.6)",
            }}
          />
        ))}
      <div
        style={{
          display: "flex",
          color: "#FFFFFF",
          fontFamily: "Cormorant",
          fontWeight: 700,
          fontSize: size * 0.94,
          lineHeight: 1,
          // Optical centring: the L's weight sits bottom-left, so nudge it right and up.
          marginLeft: size * 0.06,
          marginTop: -size * 0.04,
        }}
      >
        L
      </div>
    </div>
  );
}

async function png(font: Buffer, size: number, rounded: boolean) {
  const res = new ImageResponse(<Monogram size={size} rounded={rounded} dots={size >= 180} />, {
    width: size,
    height: size,
    fonts: [{ name: "Cormorant", data: font, weight: 700, style: "normal" }],
  });
  return Buffer.from(await res.arrayBuffer());
}

/** Packs PNGs into a multi-size .ico (PNG-compressed entries, supported by all modern browsers). */
function ico(pngs: Buffer[]) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((p, i) => {
    const w = p.readUInt32BE(16);
    const h = p.readUInt32BE(20);
    const e = 6 + 16 * i;
    header.writeUInt8(w % 256, e);
    header.writeUInt8(h % 256, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(p.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += p.length;
  });
  return Buffer.concat([header, ...pngs]);
}

const out = (path: string, data: Buffer) => writeFile(join(root, path), data).then(() => console.log(`wrote ${path}`));

async function main() {
  const font = await readFile(join(root, "scripts/icons/CormorantGaramond-Bold.woff"));
  const icon = (size: number, rounded: boolean) => png(font, size, rounded);
  await out("src/app/favicon.ico", ico(await Promise.all([16, 32, 48].map((s) => icon(s, true)))));
  await out("src/app/icon1.png", await icon(32, true));
  await out("src/app/icon2.png", await icon(192, true));
  await out("src/app/apple-icon.png", await icon(180, false));
  await out("public/icon-192.png", await icon(192, false));
  await out("public/icon-512.png", await icon(512, false));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
