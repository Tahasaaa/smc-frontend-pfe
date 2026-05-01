import { useState } from "react";
import {
  Activity,
  BellRing,
  BrainCircuit,
  ChartColumnBig,
  LayoutDashboard,
  Siren,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/marketing/ScrollReveal";
import SectionAtmosphere from "@/components/marketing/backgrounds/SectionAtmosphere";

const items = [
  {
    title: "Real-Time Monitoring",
    desc: "Track QoS indicators, service health, and critical performance metrics with always-on visibility.",
    icon: Activity,
    label: "Monitoring core",
    tone: "orange",
  },
  {
    title: "Incident Management",
    desc: "Create, assign, escalate, and resolve incidents through a clean operational workflow.",
    icon: Siren,
    label: "Execution control",
    tone: "red",
  },
  {
    title: "RCA Assistant",
    desc: "Leverage AI-assisted root cause guidance to reduce diagnosis time and accelerate response.",
    icon: BrainCircuit,
    label: "AI intelligence",
    tone: "violet",
  },
  {
    title: "Analytics & Reporting",
    desc: "Generate performance summaries, operational insights, and trend analysis from one place.",
    icon: ChartColumnBig,
    label: "Decision layer",
    tone: "green",
  },
  {
    title: "Smart Notifications",
    desc: "Receive intelligent alerting based on anomaly detection, thresholds, and incident context.",
    icon: BellRing,
    label: "Active awareness",
    tone: "amber",
  },
  {
    title: "Unified Dashboard",
    desc: "Bring KPIs, alerts, AI findings, and operational actions into a single product experience.",
    icon: LayoutDashboard,
    label: "Command surface",
    tone: "orange",
  },
] as const;

type Tone = (typeof items)[number]["tone"];

function toneStyles(tone: Tone) {
  switch (tone) {
    case "orange":
      return {
        icon: "text-[#ffd7b8] border-[#f37c03]/18 bg-[#f37c03]/[0.06]",
        glow: "rgba(243,124,3,0.18)",
      };
    case "red":
      return {
        icon: "text-red-300 border-red-300/16 bg-red-500/[0.05]",
        glow: "rgba(255,94,94,0.14)",
      };
    case "violet":
      return {
        icon: "text-violet-300 border-violet-300/16 bg-violet-500/[0.05]",
        glow: "rgba(158,119,237,0.15)",
      };
    case "green":
      return {
        icon: "text-emerald-300 border-emerald-300/16 bg-emerald-500/[0.05]",
        glow: "rgba(16,185,129,0.14)",
      };
    default:
      return {
        icon: "text-amber-200 border-amber-300/16 bg-amber-500/[0.05]",
        glow: "rgba(245,158,11,0.14)",
      };
  }
}

function FeatureCard({
  title,
  desc,
  icon: Icon,
  label,
  tone,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
  label: string;
  tone: Tone;
}) {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const styles = toneStyles(tone);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPointer({ x, y });
      }}
      onMouseLeave={() => setPointer({ x: 50, y: 50 })}
      className="group relative h-full min-h-[320px] overflow-hidden rounded-[1.65rem] border border-white/10 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.26),0_0_36px_rgba(243,124,3,0.03)] backdrop-blur-xl transition duration-300 hover:-translate-y-[2px] hover:border-[#f37c03]/14"
      style={{
        backgroundImage: `
          radial-gradient(circle at ${pointer.x}% ${pointer.y}%, ${styles.glow}, transparent 32%),
          linear-gradient(180deg, rgba(24,17,15,0.34), rgba(8,9,14,0.95))
        `,
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.65rem] border border-white/[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,193,122,0.26),transparent)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,145,111,0.05),transparent_34%)] opacity-80" />

      <div className="relative flex h-full flex-col">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-[1rem] border ${styles.icon}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/32">
          {label}
        </p>

        <h3 className="mt-3 text-[1.42rem] font-semibold tracking-[-0.04em] text-white">
          {title}
        </h3>

        <p className="mt-4 text-[15px] leading-7 text-white/58">{desc}</p>

        <div className="mt-auto pt-8">
          <div className="h-px w-full bg-gradient-to-r from-white/8 to-transparent" />
          <p className="mt-4 text-sm text-white/40">
            Built for modern telecom workflows
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-28 relative overflow-hidden px-6 py-24 lg:px-8"
    >
      <SectionAtmosphere variant="features" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.26),transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center" y={22}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f37c03]/16 bg-[linear-gradient(180deg,rgba(243,124,3,0.10),rgba(243,124,3,0.025))] px-4 py-2 text-sm text-[#ffd7b8] shadow-[0_10px_28px_rgba(243,124,3,0.08)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#f37c03]" />
            Product capabilities
          </div>

          <h2 className="text-4xl font-semibold tracking-[-0.055em] text-white sm:text-5xl lg:text-[3.55rem]">
            Powerful features for
            <span className="block bg-[linear-gradient(90deg,#f37c03_0%,#f5916f_44%,#ffb347_76%,#ffe1b6_100%)] bg-clip-text text-transparent">
              intelligent network operations
            </span>
          </h2>

          <p className="mt-6 text-[1.02rem] leading-8 text-white/64 lg:text-[1.08rem]">
            Designed for reliability, automation, and operational clarity across
            monitoring, AI analysis, reporting, and incident response.
          </p>
        </ScrollReveal>

        <StaggerGroup
          className="relative mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          delayChildren={0.04}
          staggerChildren={0.08}
        >
          {items.map((item) => (
            <StaggerItem key={item.title}>
              <FeatureCard {...item} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}