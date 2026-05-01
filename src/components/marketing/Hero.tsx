import { Activity, ArrowRight, CircleDot } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardMockup from "./mockups/DashboardMockup";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import SectionAtmosphere from "@/components/marketing/backgrounds/SectionAtmosphere";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-6 pb-24 pt-32 lg:px-8 lg:pb-28 lg:pt-36"
    >
      <SectionAtmosphere variant="hero" />

      <div className="pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-[linear-gradient(90deg,rgba(2,2,2,0.22),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[24%] bg-[linear-gradient(270deg,rgba(243,124,3,0.06),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.32),transparent)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-[700px]">
          <ScrollReveal delay={0.02} y={18} scale={0.995}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f37c03]/18 bg-[linear-gradient(180deg,rgba(243,124,3,0.12),rgba(243,124,3,0.04))] px-4 py-2 text-sm text-[#ffd7b8] shadow-[0_10px_28px_rgba(243,124,3,0.10)] backdrop-blur-md">
              <CircleDot className="h-3.5 w-3.5 fill-[#f37c03] text-[#f37c03]" />
              AI-Powered Telecom Monitoring · Orange Tunisia
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.06} y={24}>
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[#f37c03]/10 blur-3xl" />
              <div className="pointer-events-none absolute left-[28%] top-[42%] h-32 w-52 rounded-full bg-[#f5916f]/8 blur-3xl" />

              <h1 className="relative max-w-[760px] text-[3.45rem] font-semibold leading-[0.93] tracking-[-0.082em] text-white sm:text-[4.55rem] lg:text-[5.7rem] [text-shadow:0_4px_24px_rgba(0,0,0,0.34)]">
                Transforming
                <br />
                Network Monitoring
                <br />
                <span className="bg-[linear-gradient(90deg,#f37c03_0%,#f5916f_38%,#ffb347_72%,#ffe1b6_100%)] bg-clip-text text-transparent">
                  with Intelligence
                </span>
              </h1>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12} y={22}>
            <p className="mt-8 max-w-[640px] text-[1.04rem] leading-8 text-white/72 lg:text-[1.1rem]">
              A premium platform for real-time monitoring, incident management,
              territorial visibility, and AI-assisted operational decision-making
              across Tunisia’s telecom networks.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.18} y={20} scale={0.99}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-[1.22rem] border border-[#f37c03]/18 bg-[linear-gradient(90deg,#f37c03,#ffb347)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_38px_rgba(243,124,3,0.22)] transition hover:-translate-y-[1px] hover:brightness-105"
              >
                <Activity className="h-4 w-4" />
                Explore Platform
              </Link>

              <button className="inline-flex items-center justify-center gap-2 rounded-[1.22rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-3.5 text-base font-semibold text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:-translate-y-[1px] hover:border-[#f37c03]/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.24} y={14} scale={0.995}>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/58">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
                24 Governorates
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
                200+ KPIs Tracked
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
                AI-Driven RCA
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.16} y={34} scale={0.97} className="relative">
          <div className="pointer-events-none absolute -left-8 top-[10%] h-32 w-32 rounded-full bg-[#f37c03]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-[-4%] top-[24%] h-40 w-40 rounded-full bg-[#f5916f]/8 blur-3xl" />
          <DashboardMockup />
        </ScrollReveal>
      </div>
    </section>
  );
}