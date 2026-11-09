import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-muted">{site.description}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Studio</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/services" className="hover:text-ink">Services</Link></li>
            <li><Link href="/portfolio" className="hover:text-ink">Our work</Link></li>
            <li><Link href="/about" className="hover:text-ink">About</Link></li>
            <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Clients</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/quote" className="hover:text-ink">Get a quote</Link></li>
            <li><Link href="/login" className="hover:text-ink">Client login</Link></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-ink">{site.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
