import { FlowBackground } from "@/components/flow-background";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <FlowBackground />
      <Logo className="mb-10 [&_svg]:h-9" />
      <div className="glass ring-gradient w-full max-w-md rounded-3xl p-8 shadow-[0_40px_100px_-40px_color-mix(in_oklab,var(--brand-strong)_35%,transparent)] sm:p-10">
        {children}
      </div>
    </main>
  );
}
