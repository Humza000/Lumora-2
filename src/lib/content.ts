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

// FAQs carried over from the original lumoradesign.uk site.
export const faqs = [
  {
    q: "What is your typical project timeline?",
    a: "Timelines depend on project type — landing pages typically take around 1-2 weeks, redesigns 2-3 weeks, full websites 3-4 weeks, and larger or more complex projects can take a month or more. We'll give you a clear estimate once we understand your project's scope.",
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
    q: "Do you provide ongoing maintenance?",
    a: "Yes, we offer monthly and yearly maintenance packages for ongoing technical support, security updates, bug fixes, client requests and analytics reviews.",
  },
  {
    q: "How does pricing work?",
    a: "Pricing depends on the size and complexity of the project. Smaller sites and landing pages typically start from £500, while full websites and larger business projects start from £1,000+. We'll always give you a clear, upfront quote before starting any work.",
  },
  {
    q: "Do you handle copywriting and SEO?",
    a: "Yes. Our team includes strategic copywriting support and SEO best practices to give your site a strong foundation for search.",
  },
];

// Client reviews shown above the FAQs on the home page.
// REAL client quotes only, word for word, with their permission. Never invent or paraphrase.
// The whole block stays hidden while this list is empty.
//   { quote: "What the client said.", name: "Client name", role: "Owner, Business name" },
export type Review = { quote: string; name: string; role?: string };
export const reviews: Review[] = [];
