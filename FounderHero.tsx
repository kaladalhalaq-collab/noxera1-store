"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import GoldParticles from "./GoldParticles";
import { useApp } from "./Providers";

export default function FounderHero() {
  const { t } = useApp();
  // Pointer / touch position in -0.5..0.5, spring-smoothed
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const rotY = useTransform(mx, [-0.5, 0.5], [-4, 4]);
  const rotX = useTransform(my, [-0.5, 0.5], [3, -3]);
  const imgX = useTransform(mx, [-0.5, 0.5], [14, -14]);
  const glowX = useTransform(mx, [-0.5, 0.5], [-60, 60]);
  const glowY = useTransform(my, [-0.5, 0.5], [-40, 40]);
  const bgX = useTransform(mx, [-0.5, 0.5], [-20, 20]);

  return (
    <section onPointerMove={onMove} className="relative isolate -mt-20 min-h-[100svh] overflow-hidden bg-ink text-soft">
      {/* Atmosphere: each layer moves at a different depth */}
      <motion.div style={{ x: bgX }} aria-hidden className="absolute inset-[-5%] -z-30 bg-[radial-gradient(ellipse_at_70%_40%,#171717,#080808_70%)]" />
      <motion.div style={{ x: glowX, y: glowY }} aria-hidden
        className="absolute end-[5%] top-[10%] -z-20 h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(198,166,106,.45),transparent_65%)] blur-3xl" />
      <div aria-hidden className="absolute end-[30%] top-[45%] -z-20 h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(110,60,170,.28),transparent_65%)] blur-3xl" />
      <motion.div aria-hidden animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute end-[8%] top-[12%] -z-10 hidden h-[76vh] w-[40vw] rounded-[50%] border border-gold/20 shadow-[0_0_120px_30px_rgba(198,166,106,.18)] lg:block" />
      <GoldParticles className="-z-[5]" />

      <div className="mx-auto grid min-h-[100svh] max-w-[1400px] items-center px-6 lg:grid-cols-[1.05fr_1fr] lg:px-12">
        {/* Portrait: on top for mobile, beside the text on desktop */}
        <motion.div initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1200 }} className="relative order-1 -mx-6 pt-20 lg:order-2 lg:mx-0 lg:pt-0">
          <motion.div style={{ rotateX: rotX, rotateY: rotY, x: imgX }}
            className="relative mx-auto aspect-[1199/1312] w-full max-w-[640px] lg:aspect-[3/4] lg:max-w-none">
            <Image src="/images/noxera-founder.png" alt="NOXÉRA founder wearing the NOXÉRA training tee" fill priority quality={95}
              sizes="(min-width:1024px) 48vw, 100vw"
              className="object-cover object-[100%_20%] [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_55%,#080808_100%)]" />
            <div aria-hidden className="absolute -bottom-6 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-gold/25 blur-3xl" />
          </motion.div>
        </motion.div>

        {/* Typography */}
        <div className="relative z-10 order-2 -mt-24 pb-16 lg:order-1 lg:mt-0 lg:pb-0">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }}
            className="eyebrow mb-5 tracking-[0.55em]">{t("hero.eyebrow")}</motion.p>
          <h1 className="overflow-hidden font-display text-[clamp(3.2rem,11vw,8rem)] font-light leading-none tracking-[0.12em] gold-text">
            <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.7, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="inline-block pb-2">
              NOXÉRA
            </motion.span>
          </h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.3, duration: 1 }}
            className="my-6 h-px w-40 origin-left bg-gradient-to-r from-gold to-transparent rtl:origin-right rtl:bg-gradient-to-l" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
            className="text-sm uppercase tracking-[0.4em] text-soft/80 sm:text-base rtl:tracking-normal">
            {t("hero.tag1")}<br />{t("hero.tag2")}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.9 }}
            className="mt-10 flex flex-wrap gap-4">
            <Link href="/shop/men" className="btn-gold">{t("hero.shop")}</Link>
            <Link href="/shop/all" className="btn-ghost">{t("hero.explore")}</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
