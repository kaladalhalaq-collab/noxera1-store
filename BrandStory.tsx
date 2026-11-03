"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useApp } from "./Providers";

/** Brand story: dimmed cinematic crop as backdrop behind three pillars. */
export default function BrandStory() {
  const { t } = useApp();
  return (
    <section className="relative isolate overflow-hidden bg-ink py-28">
      <Image src="/images/noxera-founder.png" alt="" fill sizes="100vw" className="-z-10 object-cover object-[95%_50%] opacity-25 blur-[2px]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/90 to-ink/60 rtl:bg-gradient-to-l" />
      <div className="container-x">
        <h2 className="h-display max-w-xl lg:text-6xl">{t("story.title")}</h2>
        <div className="mt-14 grid gap-px bg-gold/20 md:grid-cols-3">
          {[1, 2, 3].map((n, i) => (
            <motion.div key={n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.8 }} className="bg-ink/90 p-8 transition hover:bg-graphite">
              <p className="eyebrow">0{n}</p>
              <h3 className="mt-4 text-xl tracking-wide">{t(`pillar${n}.t`)}</h3>
              <p className="mt-2 text-sm text-soft/60">{t(`pillar${n}.d`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
