/**
 * Soft, flowing lavender background: a smooth mesh gradient, slowly drifting
 * light blobs and silky wave ribbons. Place inside a `relative isolate` parent.
 */
export function FlowBackground({ waves = true }: { waves?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="bg-mesh absolute inset-0" />
      <div className="animate-aurora absolute top-[-15%] left-[-10%] h-[36rem] w-[36rem] rounded-full bg-brand-tint/45 blur-[110px]" />
      <div className="animate-aurora absolute top-[0%] right-[-12%] h-[32rem] w-[32rem] rounded-full bg-brand/25 blur-[120px] [animation-delay:-7s]" />
      <div className="animate-aurora absolute bottom-[-25%] left-[35%] h-[26rem] w-[26rem] rounded-full bg-brand-soft blur-[100px] [animation-delay:-13s]" />

      {waves && (
        <svg
          className="animate-drift absolute -right-[8%] bottom-[-8%] h-[75%] w-[75%] opacity-70 [mask-image:linear-gradient(to_right,transparent,#000_40%),linear-gradient(to_top,#000_70%,transparent)] [mask-composite:intersect]"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="flow-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbb5ff" stopOpacity="0" />
              <stop offset="45%" stopColor="#a577ff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#7d4dff" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="flow-b" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#efe8ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#cbb5ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#a577ff" stopOpacity="0.2" />
            </linearGradient>
            <filter id="flow-blur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <g filter="url(#flow-blur)">
            <path d="M0,420 C220,300 380,520 620,380 C840,250 980,330 1200,180 L1200,600 L0,600 Z" fill="url(#flow-b)" />
            <path d="M0,500 C260,380 420,560 680,440 C900,340 1040,420 1200,300 L1200,600 L0,600 Z" fill="url(#flow-a)" />
          </g>
          <g stroke="url(#flow-a)" strokeWidth="1.5">
            <path d="M0,360 C240,250 400,470 640,330 C860,200 1000,280 1200,140" />
            <path d="M0,390 C240,280 410,500 650,360 C870,230 1010,310 1200,170" opacity="0.6" />
            <path d="M0,420 C250,310 420,530 660,390 C880,260 1020,340 1200,200" opacity="0.35" />
          </g>
        </svg>
      )}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}
