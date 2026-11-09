// Site-wide constants. Edit business details here.
export const site = {
  name: "Lumora",
  tagline: "We build websites that convert.",
  description:
    "Lumora is a boutique web design and development studio crafting premium, high-performance websites for ambitious brands.",
  email: "hello@lumoradesign.uk", // TODO: confirm contact email
  url: process.env.APP_URL ?? "http://localhost:3000",
  // Path to the logo in /public. Replace public/logo.svg with the real logo.
  logo: "/logo.svg",
};

export function appUrl(path = "") {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
