import { ArrowRight, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import SectionAtmosphere from "@/components/marketing/backgrounds/SectionAtmosphere";

export default function NetworkCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:px-8">
      <SectionAtmosphere variant="hero" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.26),transparent)]" />

      <ScrollReveal y={34} scale={0.97}>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,16,14,0.92),rgba(8,9,14,0.98))] shadow-[0_32px_100px_rgba(0,0,0,0.36),0_0_70px_rgba(243,124,3,0.06)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(243,124,3,0.20),transparent_30%),radial-gradient(circle_at_78%_28%,rgba(245,145,111,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,179,71,0.10),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.07]" />
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,209,166,0.52),transparent)]" />
          <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-[#f37c03]/18 blur-3xl" />
          <div className="absolute right-[10%] top-[10%] h-44 w-44 rounded-full bg-[#f5916f]/14 blur-3xl" />
          <div className="absolute bottom-[-40px] left-[35%] h-44 w-44 rounded-full bg-[#ffb347]/10 blur-3xl" />

          <div className="relative px-8 py-14 text-center md:px-14 md:py-16">
            <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#f37c03]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] text-white shadow-[0_16px_38px_rgba(243,124,3,0.16)] backdrop-blur-md">
              <Wifi className="h-8 w-8" />
            </div>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[#f37c03]/16 bg-[#f37c03]/[0.06] px-4 py-2 text-sm text-[#ffd7b8] shadow-[0_8px_22px_rgba(243,124,3,0.08)]">
              <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
              Premium operational access
            </div>

            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.06em] text-white sm:text-5xl lg:text-[3.8rem]">
              Ready to elevate your
              <span className="block bg-[linear-gradient(90deg,#f37c03_0%,#f5916f_42%,#ffb347_78%,#ffe1b6_100%)] bg-clip-text text-transparent">
                network operations?
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-[1.04rem] leading-8 text-white/72 lg:text-[1.1rem]">
              Centralize monitoring, accelerate incident response, and operate with
              confidence through one intelligent QoS platform built for modern NOC teams.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-[1.25rem] border border-[#f37c03]/20 bg-[linear-gradient(135deg,#f37c03_0%,#f5916f_44%,#ffb347_100%)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_16px_36px_rgba(243,124,3,0.30)] transition hover:-translate-y-[1px] hover:brightness-105"
              >
                Access Dashboard
              </Link>

              <button className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-7 py-3.5 text-base font-semibold text-white/90 backdrop-blur-md transition hover:-translate-y-[1px] hover:border-[#f37c03]/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))]">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}