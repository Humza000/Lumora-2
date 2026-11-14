import { TabSessionGuard } from "@/components/tab-session";

// The quote wizard is account-gated, so it follows the same per-tab sign-in rule as the portal.
export default function QuoteLayout({ children }: LayoutProps<"/quote">) {
  return <TabSessionGuard>{children}</TabSessionGuard>;
}
