"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ComponentPropsWithoutRef,
  type PointerEvent,
} from "react";

/**
 * Fades + lifts children in when scrolled into view. Styles live in globals.css
 * ([data-reveal]); reduced-motion users get the content immediately.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  delay = 0,
  style,
  ...props
}: { as?: T; delay?: number } & ComponentPropsWithoutRef<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={shown ? "in" : ""}
      style={{ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties}
      {...props}
    />
  );
}

/** Tracks the pointer and exposes --mx/--my for the `spotlight` utility. */
export function Spotlight<T extends ElementType = "div">({
  as,
  className,
  ...props
}: { as?: T } & ComponentPropsWithoutRef<T>) {
  const Tag = (as ?? "div") as ElementType;
  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return <Tag className={`spotlight ${className ?? ""}`} onPointerMove={onPointerMove} {...props} />;
}

/** True once the page has scrolled past `offset` px. */
export function useScrolled(offset = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return scrolled;
}
