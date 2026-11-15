import { formatGBP } from "./money";
import { DEFAULT_PRICES } from "./pricing";

// Marketing copy shared across public pages. Edit freely.

export const services = [
  {
    title: "Website design",
    description: "Distinctive, on-brand designs built around your customers and engineered to convert visitors into enquiries.",
    points: ["Bespoke or refined-template design", "Mobile-first and accessible", "Conversion-focused layouts"],
  },
  {
    title: "Development",
    description: "Fast, secure, modern websites and web apps, from landing pages to bookings, memberships and portals.",
    points: ["Lightning-fast performance", "Bookings, payments & integrations", "Editable content (CMS)"],
  },
  {
    title: "E-commerce",
    description: "Online stores that feel premium and make checkout effortless, so more browsers become buyers.",
    points: ["Seamless checkout", "Product management", "Payments & shipping setup"],
  },
  {
    title: "Hosting & care plans",
    description: "We keep your site online, secure and up to date, so you can focus on running your business.",
    points: ["Managed hosting & SSL", "Updates, backups & monitoring", "Small content changes included"],
  },
];

export const process = [
  { step: "01", title: "Get a quote", description: "Answer a few questions in our quote wizard and get an instant indicative estimate." },
  { step: "02", title: "Plan", description: "We refine scope, timeline and price into a clear proposal, with no surprises." },
  { step: "03", title: "Design & build", description: "Follow every milestone live in your client portal as we design and develop." },
  { step: "04", title: "Launch & care", description: "We launch, measure and keep your site fast, secure and up to date." },
];

// FAQs (also published as FAQPage structured data). Prices come from the quote wizard's
// DEFAULT_PRICES so these answers stay in step with the wizard; admin-edited prices aren't reflected here.
const from = (key: string) => formatGBP(DEFAULT_PRICES[key] ?? 0, { whole: true });

export const faqs = [
  {
    q: "What is your typical project timeline?",
    a: "Timelines depend on project type — landing pages typically take around 1-2 weeks, business websites 2-4 weeks, and e-commerce stores, web apps and custom builds can take a month or more. We'll give you a clear estimate once we understand your project's scope.",
  },
  {
    q: "Do you use templates?",
    a: "No. Every project we undertake is fully custom-designed for your brand to perfectly align with your unique needs and goals.",
  },
  {
    q: "What tech stack do you use?",
    a: "We specialize in modern React ecosystems (Next.js, Vite), robust headless CMS solutions (Sanity, Contentful), and modern CSS frameworks like Tailwind.",
  },
  {
    q: "Do you provide hosting and ongoing maintenance?",
    a: "Yes, and it's optional. We offer hosting and care plans covering technical support, security and software updates, backups, bug fixes and small content changes. You can pay monthly or yearly (paying yearly works out cheaper), or host the website yourself if you prefer.",
  },
  {
    q: "How does pricing work?",
    a: `Every project has a starting price: landing pages from ${from("start_landing")}, business websites from ${from("start_business")}, e-commerce stores from ${from("start_ecommerce")}, and web apps or custom builds from ${from("start_webapp")}. Our quote wizard gives you an instant estimate, and the features you choose help us understand your project rather than adding individual charges. Complex functionality may need a tailored quote. We'll always confirm the final price before any work begins.`,
  },
  {
    q: "What if I'm not happy with my website?",
    a: "We offer a money-back guarantee. We'll work with you on revisions until you're happy with your website, and if you're still not satisfied before it goes live, we'll refund your payment. No hard feelings.",
  },
];

// Client reviews shown above the FAQs on the home page.
// REAL client quotes only, word for word, with their permission. Never invent or paraphrase.
// The whole block stays hidden while this list is empty.
//   { quote: "What the client said.", name: "Client name", role: "Owner, Business name" },
export type Review = { quote: string; name: string; role?: string };
export const reviews: Review[] = [];
