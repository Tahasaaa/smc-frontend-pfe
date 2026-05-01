import { Activity, BrainCircuit, MapPinned, Zap } from "lucide-react";
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/marketing/ScrollReveal";
import SectionAtmosphere from "@/components/marketing/backgrounds/SectionAtmosphere";

const stats = [
  { icon: Zap, value: "65%", label: "MTTR Reduction", tone: "orange" },
  { icon: Activity, value: "99.95%", label: "Platform Uptime", tone: "green" },
  { icon: BrainCircuit, value: "87%", label: "AI Accuracy", tone: "violet" },
  { icon: MapPinned, value: "24", label: "Governorates Covered", tone: "amber" },
];

const pillars = [
  {
    title: "Anomaly Detection",
    desc: "Detect service degradation, threshold breaches, and KPI drift before customer impact escalates.",
  },
  {
    title: "Incident Prioritization",
    desc: "Focus engineering effort where urgency, severity, and operational pressure are highest.",
  },
  {
    title: "Regional Visibility",
    desc: "Maintain a unified territorial view across governorates, technologies, and service layers.",
  },
  {
    title: "Actionable Analytics",
    desc: "Turn raw telecom data into decisions with trends, summaries, and guided interpretation.",
  },
];

function toneClass(tone: string) {
  switch (tone) {
    case "orange":
      return "border-[#f37c03]/18 bg-[#f37c03]/[0.06] text-[#ffd7b8]";
    case "green":
      return "border-emerald-400/16 bg-emerald-500/[0.05] text-emerald-300";
    case "violet":
      return "border-violet-400/16 bg-violet-500/[0.05] text-violet-300";
    default:
      return "border-amber-300/16 bg-amber-500/[0.05] text-amber-200";
  }
}

export default function MissionSection() {
  return (
    <section
      id="monitoring"
      className="scroll-mt-28 relative overflow-hidden px-6 py-24 lg:px-8"
    >
      <SectionAtmosphere variant="mission" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.28),transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto max-w-4xl text-center" y={22}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f37c03]/18 bg-[linear-gradient(180deg,rgba(243,124,3,0.10),rgba(243,124,3,0.03))] px-4 py-2 text-sm text-[#ffd7b8] shadow-[0_10px_28px_rgba(243,124,3,0.08)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
            Nationwide Monitoring Mission
          </div>

          <h2 className="text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-[3.45rem]">
            Proactive monitoring is the foundation of
            <span className="block bg-[linear-gradient(90deg,#f37c03_0%,#f5916f_44%,#ffb347_76%,#ffe1b6_100%)] bg-clip-text text-transparent">
              resilient network operations
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-4xl text-[1.02rem] leading-8 text-white/64 lg:text-[1.08rem]">
            Our platform helps engineering teams detect anomalies earlier,
            reduce incident response time, and maintain service reliability
            through stronger operational visibility across Tunisia’s telecom infrastructure.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-5 xl:grid-cols-[1.22fr_0.78fr]">
          <ScrollReveal delay={0.05} y={28}>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,15,0.40),rgba(8,9,14,0.95))] shadow-[0_24px_70px_rgba(0,0,0,0.30),0_0_56px_rgba(243,124,3,0.05)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(243,124,3,0.10),transparent_22%),radial-gradient(circle_at_100%_100%,rgba(245,145,111,0.05),transparent_24%)]" />
              <div className="relative border-b border-white/6 px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/32">
                      Operations Impact
                    </p>
                    <h3 className="mt-3 text-[1.78rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                      Built for NOC teams that need speed, clarity, and control
                    </h3>
                  </div>

                  <div className="hidden h-12 w-12 items-center justify-center rounded-[1rem] border border-[#f37c03]/16 bg-[#f37c03]/[0.05] text-[#ffd7b8] md:flex">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <StaggerGroup
                className="relative grid gap-4 p-6 sm:grid-cols-2"
                delayChildren={0.08}
                staggerChildren={0.08}
              >
                {pillars.map((pillar) => (
                  <StaggerItem key={pillar.title}>
                    <div className="rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(11,16,22,0.96)_0%,rgba(8,13,19,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)] transition hover:-translate-y-[1px] hover:border-[#f37c03]/14 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.018),0_16px_36px_rgba(0,0,0,0.18)]">
                      <p className="text-[1rem] font-semibold tracking-[-0.02em] text-white/92">
                        {pillar.title}
                      </p>
                      <p className="mt-3 text-[15px] leading-7 text-white/58">
                        {pillar.desc}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </ScrollReveal>

          <StaggerGroup
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2"
            delayChildren={0.1}
            staggerChildren={0.08}
          >
            {stats.map((item, index) => {
              const Icon = item.icon;

              return (
                <StaggerItem key={index}>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,17,15,0.32),rgba(8,9,14,0.94))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24),0_0_34px_rgba(243,124,3,0.04)] backdrop-blur-xl transition hover:-translate-y-[1px] hover:border-[#f37c03]/14">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-[1rem] border ${toneClass(
                        item.tone
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="mt-6">
                      <p className="text-[2.1rem] font-semibold tracking-[-0.06em] text-white">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm text-white/52">{item.label}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}