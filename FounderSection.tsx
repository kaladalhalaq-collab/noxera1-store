"use client";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useApp } from "./Providers";

/** About the Founder: tight crop on the arms-crossed pose with scroll parallax. */
export default function FounderSection() {
  const { t } = useApp();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  return (
    <section ref={ref} className="bg-ink px-6 py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden border border-gold/25">
          <motion.div style={{ y }} className="absolute inset-[-10%]">
            <Image src="/images/noxera-founder.png" alt="The founder of NOXÉRA, arms crossed" fill quality={90}
              sizes="(min-width:1024px) 40vw, 90vw" className="object-cover object-[75%_75%]" />
          </motion.div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1 }}>
          <p className="eyebrow">{t("founder.eyebrow")}</p>
          <h2 className="h-display mt-5 leading-tight">{t("founder.title")}</h2>
          <p className="mt-6 max-w-md leading-relaxed text-soft/70">{t("founder.body")}</p>
        </motion.div>
      </div>
    </section>
  );
}
