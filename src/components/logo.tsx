import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={className} aria-label={`${site.name} home`}>
      <Image src={site.logo} alt={site.name} width={132} height={32} priority unoptimized />
    </Link>
  );
}
