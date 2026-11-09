// Registry of built-in client website mockups, referenced by PortfolioItem.mockup.
// Client brand colours live inside each mockup file (deliberate exception to the
// "no hard-coded colours" rule: they depict the client's site, not Lumora's).
import type { ComponentType } from "react";
import * as maison from "./maison";
import * as miso from "./miso";
import * as northline from "./northline";

export type Mockup = {
  label: string;
  url: string; // page title shown in the browser frame (deliberately not a real domain)
  Desktop: ComponentType;
  Mobile: ComponentType;
  Detail: ComponentType;
  detailCaption: string;
};

export const MOCKUPS: Record<string, Mockup> = {
  northline: { label: "Northline Plumbing & Heating", url: "Northline Plumbing & Heating · Home", detailCaption: "3-step instant quote and online booking", ...northline },
  maison: { label: "Maison & Co Interiors", url: "Maison & Co Interiors · The Autumn Edit", detailCaption: "“View in your room” AR preview with slide-out checkout", ...maison },
  miso: { label: "Miso House", url: "Miso House · Modern Japanese, Leeds", detailCaption: "Table booking and the Miso Club loyalty card", ...miso },
};

export const MOCKUP_OPTIONS = [
  { value: "", label: "None (use image URL)" },
  ...Object.entries(MOCKUPS).map(([value, m]) => ({ value, label: m.label })),
];

export function getMockup(key: string | null | undefined) {
  return key ? MOCKUPS[key] : undefined;
}
