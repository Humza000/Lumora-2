import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="animate-aurora absolute top-[-15%] left-[10%] h-[30rem] w-[30rem] rounded-full bg-brand/40 blur-[120px]" />
        <div className="animate-aurora absolute right-[5%] bottom-[-15%] h-[28rem] w-[28rem] rounded-full bg-brand-strong/25 blur-[120px] [animation-delay:-8s]" />
        <div className="bg-grid absolute inset-0" />
        <div className="grain absolute inset-0" />
      </div>
      <Logo className="mb-10 [&_svg]:h-9" />
      <div className="glass ring-gradient w-full max-w-md rounded-3xl p-8 shadow-[0_40px_100px_-40px_rgba(165,119,255,0.6)] sm:p-10">
        {children}
      </div>
    </main>
  );
}
