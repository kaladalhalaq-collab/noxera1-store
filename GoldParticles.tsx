"use client";
import { useEffect, useRef } from "react";

/** Lightweight 2D-canvas gold dust. Pauses offscreen and respects reduced-motion. */
export default function GoldParticles({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, visible = true;
    const count = window.innerWidth < 768 ? 22 : 48;
    const ps = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.00008 + 0.00003, p: Math.random() * 6.28,
    }));
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(c);
    resize();
    window.addEventListener("resize", resize);
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y -= p.s * 16;
        if (p.y < -0.02) p.y = 1.02;
        const x = (p.x + Math.sin(t / 3000 + p.p) * 0.015) * w;
        const a = 0.25 + 0.5 * Math.abs(Math.sin(t / 1500 + p.p));
        ctx.beginPath();
        ctx.arc(x, p.y * h, p.r, 0, 6.28);
        ctx.fillStyle = `rgba(198,166,106,${a})`;
        ctx.shadowColor = "#C6A66A";
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
