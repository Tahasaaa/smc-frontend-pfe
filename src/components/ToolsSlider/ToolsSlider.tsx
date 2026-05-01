import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import SectionAtmosphere from "@/components/marketing/backgrounds/SectionAtmosphere";

const logos = [
  { src: "/logos/logo3.png", alt: "Logo 3" },
  { src: "/logos/logo4.png", alt: "Logo 4" },
  { src: "/logos/logo5.png", alt: "Logo 5" },
  { src: "/logos/logo6.png", alt: "Logo 6" },
  { src: "/logos/logo7.png", alt: "Logo 7" },
  { src: "/logos/logo8.png", alt: "Logo 8" },
  { src: "/logos/logo9.png", alt: "Logo 9" },
];

const duplicatedLogos = [...logos, ...logos];

export default function ToolsSlider() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:px-8">
      <SectionAtmosphere variant="tools" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.35),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,145,111,0.18),transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal className="mb-8 text-center" y={24}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f37c03]/18 bg-[linear-gradient(180deg,rgba(243,124,3,0.10),rgba(243,124,3,0.03))] px-4 py-2 text-sm text-[#ffd7b8] shadow-[0_10px_28px_rgba(243,124,3,0.10)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
            Trusted tools ecosystem
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3.15rem]">
            Integrated with a
            <span className="block bg-[linear-gradient(90deg,#f37c03_0%,#f5916f_46%,#ffb347_78%,#ffe1b6_100%)] bg-clip-text text-transparent">
              modern operational stack
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            Monitoring, incident workflows, analytics, and AI-assisted operations
            aligned in one telecom platform ecosystem.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} y={34} scale={0.98}>
          <div className="relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.36),0_0_60px_rgba(243,124,3,0.07)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(243,124,3,0.10),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(245,145,111,0.06),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(255,179,71,0.06),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-[2.15rem] border border-white/[0.04]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,220,180,0.28),transparent)]" />

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#04060d] via-[#04060d]/88 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-[#04060d] via-[#04060d]/88 to-transparent" />

            <motion.div
              className="relative flex w-max items-center gap-8 md:gap-10"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 24,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              {duplicatedLogos.map((logo, index) => (
                <div
                  key={`${logo.alt}-${index}`}
                  className="group flex min-w-[170px] items-center justify-center md:min-w-[190px]"
                >
                  <div className="relative flex h-[92px] w-[170px] items-center justify-center rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_30px_rgba(0,0,0,0.16)] transition duration-300 group-hover:-translate-y-[2px] group-hover:border-[#f37c03]/22 group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.03))] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_36px_rgba(0,0,0,0.22),0_0_28px_rgba(243,124,3,0.08)] md:w-[190px]">
                    <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-[radial-gradient(circle_at_50%_0%,rgba(245,145,111,0.08),transparent_35%)] opacity-0 transition duration-300 group-hover:opacity-100" />

                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="relative z-10 max-h-10 w-auto object-contain opacity-90 grayscale-[18%] contrast-125 brightness-110 transition duration-300 group-hover:scale-[1.05] group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}