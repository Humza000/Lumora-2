// Portfolio case studies. Used by the seed script (re-running the seed refreshes them).
// Results (`stats`) and testimonials are intentionally NOT included: only add REAL
// figures and quotes from the client, via Admin → Portfolio.

export const portfolioSeed = [
  {
    slug: "northline-plumbing-heating",
    title: "Northline Plumbing & Heating",
    client: "Northline Plumbing & Heating",
    sector: "Trades · Local Services",
    location: "Manchester & Salford",
    year: 2026,
    summary: "A fast, trust-first website that turns emergency searches into booked jobs, with instant fixed-price quotes.",
    services: ["Web design", "Development", "Instant-quote calculator", "Local SEO", "Hosting & care"],
    overview:
      "Northline is a family-run, Gas Safe registered plumbing and heating firm covering Manchester and Salford. Their customers are homeowners and landlords who usually find them in a hurry, often from a phone, at the moment something has gone wrong: a boiler that won't fire, a leak through the ceiling, a radiator that's stone cold.",
    challenge:
      "Most of Northline's work came through word of mouth and phone calls, and their old site didn't help: it was slow on mobile, the phone number was buried, and prices were never mentioned, so people rang round competitors instead. The team also lost evenings returning calls just to give ballpark quotes for routine jobs like boiler services.",
    approach:
      "We designed around the two things a stressed customer needs in the first five seconds: a way to reach an engineer now, and confidence they won't be overcharged. A persistent emergency bar and tap-to-call buttons sit on every page, and a three-step instant-quote calculator gives fixed prices for routine jobs and lets customers pick a slot without a phone call. Service and area pages were written for local search, and the site was built to load quickly on mid-range phones over mobile data.",
    features: [
      "24/7 emergency call bar and tap-to-call",
      "Instant fixed-price quote calculator",
      "Online booking for routine jobs",
      "Service-area pages for local SEO",
      "Reviews showcase and Gas Safe badges",
      "Mobile-first, fast-loading build",
    ],
    outcomes: [
      "Customers can get a fixed price and book a boiler service without making a call",
      "Emergency enquiries reach an engineer in one tap from any page",
      "A clear, modern brand that matches the quality of the team's work",
      "Separate pages for each service and area the team covers, ready for local search",
      "Northline's team can update prices and services themselves",
    ],
    mockup: "northline",
    featured: true,
  },
  {
    slug: "maison-co",
    title: "Maison & Co Interiors",
    client: "Maison & Co Interiors",
    sector: "E-commerce · Home & Interiors",
    location: "London",
    year: 2026,
    summary: "A calm, editorial online store for a curated interiors brand, with an AR “view in your room” preview and a seamless checkout.",
    services: ["Brand-led web design", "E-commerce build", "AR product preview", "Product photography direction", "Hosting & care"],
    overview:
      "Maison & Co is an independent interiors brand selling furniture, lighting and objects made by small workshops across the UK and Europe. Their customers are design-conscious homeowners furnishing a space slowly and carefully, who expect the online experience to feel as considered as the products themselves.",
    challenge:
      "Maison & Co's pieces are premium and often made to order, but their previous off-the-shelf store made them look like any other homewares shop. Shoppers struggled to judge scale and colour from small photos, which held them back from buying larger items online, and the checkout felt clunky on mobile.",
    approach:
      "We built an editorial store that lets the products breathe: generous whitespace, a refined serif wordmark, warm natural tones and storytelling about the makers alongside every collection. For larger pieces we added a “view in your room” AR preview so customers can place a chair or table in their own space at true scale, and we redesigned the bag and checkout as a slide-out drawer with express payment options so buying on a phone takes seconds.",
    features: [
      "Editorial collections and maker stories",
      "AR “view in your room” preview",
      "Colour and finish swatches per product",
      "Slide-out bag with express checkout",
      "Made-to-order lead times on product pages",
      "White-glove delivery messaging",
    ],
    outcomes: [
      "An online store that reflects the brand's premium, handcrafted positioning",
      "Shoppers can see larger pieces at true scale in their own room before buying",
      "A faster, simpler checkout on mobile with express payment options",
      "Collection and journal pages that give Maison & Co a stronger story to share on social",
      "A product catalogue the team can manage and expand without a developer",
    ],
    mockup: "maison",
    featured: true,
  },
  {
    slug: "miso-house",
    title: "Miso House",
    client: "Miso House",
    sector: "Hospitality · Restaurant",
    location: "Leeds",
    year: 2025,
    summary: "A bold, appetite-led website for a modern Japanese restaurant, with live table booking, a mobile menu and a digital loyalty card.",
    services: ["Web design", "Development", "Online reservations", "Loyalty programme integration", "Hosting & care"],
    overview:
      "Miso House is a modern Japanese restaurant and late bar serving slow-cooked ramen, robata grill and small plates to share. Their guests are a mix of after-work groups, date nights and regulars who pop in for a bowl of ramen, and most of them check the menu and book from their phones on the way.",
    challenge:
      "Bookings were split across phone calls, social media messages and walk-ins, which made busy nights hard to plan. The menu lived in a PDF that was awkward to read on a phone and quickly went out of date, and the paper loyalty cards that regulars loved were easy to lose.",
    approach:
      "We gave Miso House a confident visual identity online, with deep ink tones, their signature red and illustrated bowls, so the site feels like the restaurant. Reservations happen directly on the homepage with live time slots. The menu became a fast, filterable mobile page the team can update daily, specials included. The Miso Club loyalty card moved online, so regulars can track their stamps without carrying a card.",
    features: [
      "Homepage table booking with live time slots",
      "Mobile-first, filterable menu",
      "Daily specials the team can update in minutes",
      "Miso Club digital loyalty card",
      "Takeaway ordering link and opening hours",
      "Location, directions and private-hire enquiries",
    ],
    outcomes: [
      "Guests can see availability and book a table in a few taps, day or night",
      "One place for bookings instead of phone, DMs and walk-ins",
      "A menu that's always up to date and easy to read on a phone",
      "A digital loyalty card that rewards regulars without the paper",
      "A brand presence online that matches the atmosphere of the restaurant",
    ],
    mockup: "miso",
    featured: true,
  },
];

/** Slugs from the old site that are now hidden (kept in the DB so they can be restored in admin). */
export const retiredPortfolioSlugs = [
  "peak-performance-gym",
  "sterling-legal-group",
  "the-workshop-cafe",
  "brightsmile-dental",
  "tradecraft-plumbing",
];
