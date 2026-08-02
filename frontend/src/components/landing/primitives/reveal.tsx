"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@utils";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger within a group, in ms. */
  delay?: number;
  /**
   * Element to render. Lists need `li` here — a wrapper `div` between `ul`
   * and its items is invalid markup and breaks list semantics for screen
   * readers.
   */
  as?: "div" | "li";
  className?: string;
}

/**
 * Reveals its children once, when they first scroll into view. The observer
 * disconnects as soon as it fires, so nothing keeps running while scrolling.
 * Reduced-motion users get the finished state from CSS and never see a
 * transition.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Nodes already on screen at load fire on the first observation, so this
    // covers the above-the-fold case without a separate branch.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      data-shown={shown ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("u-reveal", className)}
    >
      {children}
    </Tag>
  );
}
