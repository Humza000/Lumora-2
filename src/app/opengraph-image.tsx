import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Default social share image (link previews on WhatsApp, LinkedIn, iMessage, X…).
// Brand hex values are a deliberate copy, like emails and the invoice PDF.
export const alt = `${site.name}: web design & development studio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const icon = await readFile(join(process.cwd(), "public/lumora_profile_pic_1782764569677.png"));
  const src = `data:image/png;base64,${icon.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "linear-gradient(135deg, #F8F7FF 0%, #EDE9FE 60%, #DDD6FE 100%)",
          color: "#17152B",
        }}
      >
        <img src={src} width={300} height={300} alt="" style={{ borderRadius: 64, boxShadow: "0 30px 80px -30px rgba(139,92,246,0.55)" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#6D28D9" }}>Web design & development</div>
          <div style={{ marginTop: 20, fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{site.tagline}</div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#4B4766" }}>Custom websites · E-commerce · Hosting</div>
        </div>
      </div>
    ),
    size,
  );
}
