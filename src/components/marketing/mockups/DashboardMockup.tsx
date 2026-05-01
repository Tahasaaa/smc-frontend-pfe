import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  ShieldAlert,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import type { MouseEvent } from "react";

const bars = [18, 22, 20, 24, 21, 19, 23, 26, 22, 25, 29, 27, 31, 24, 26, 23];

export default function DashboardMockup() {
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 120, damping: 18 });

  const glowX = useTransform(rotateY, [-10, 10], ["44%", "56%"]);
  const glowY = useTransform(rotateX, [-10, 10], ["44%", "56%"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const ry = (px - 0.5) * 12;
    const rx = (0.5 - py) * 12;

    rotateXRaw.set(rx);
    rotateYRaw.set(ry);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-[700px]">
      <div className="absolute -inset-10 rounded-full bg-orange-500/8 blur-3xl" />
      <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-[#ff9a2b]/8 blur-3xl" />

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-visible rounded-[2rem] border border-orange-300/18 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(7,8,13,0.97))] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <motion.div
          style={{ left: glowX, top: glowY }}
          className="pointer-events-none absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/10 blur-3xl"
        />

        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,170,73,0.7),transparent)]" />
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_78%_24%,rgba(255,132,29,0.10),transparent_18%),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.012),transparent_26%)]" />

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>

          <div className="flex items-center gap-2 text-sm text-white/56">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
            smc-qos.orange.tn · Live NOC
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MiniStatCard title="ERAB SR" value="97.4%" tone="green" />
          <MiniStatCard title="Drop Call" value="1.2%" tone="orange" />
          <MiniStatCard title="PRB DL" value="78%" tone="orange" />
          <MiniStatCard title="Availability" value="99.95%" tone="green" />
        </div>

        <div className="mt-4 rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-medium text-white/76">
              Throughput DL · Last 48h
            </p>
            <span className="rounded-full border border-orange-300/18 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-orange-200">
              Live
            </span>
          </div>

          <div className="relative h-32 overflow-hidden rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.006))] px-4 pb-4 pt-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-25" />
            <div className="relative flex h-full items-end gap-2">
              {bars.map((bar, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 10 }}
                  animate={{ height: `${bar}%` }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.03,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1.1,
                  }}
                  className={`w-full rounded-t-[0.6rem] ${
                    i % 5 === 0
                      ? "bg-[#3b82f6]"
                      : i % 5 === 1
                      ? "bg-[#ff7a00]"
                      : i % 5 === 2
                      ? "bg-[#f7b500]"
                      : i % 5 === 3
                      ? "bg-[#ff4d4d]"
                      : "bg-[#ff9f2e]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <IncidentRow tone="red" label="CRIT" code="TUN-SF-034" text="ERAB Drop Rate Exceeded" />
          <IncidentRow tone="orange" label="WATCH" code="TUN-AR-012" text="PRB DL Utilization High" />
          <IncidentRow tone="neutral" label="INFO" code="TUN-GA-021" text="RCA context refreshed" />
        </div>

        <div className="pointer-events-none absolute -right-7 top-9 rounded-[1.25rem] border border-emerald-400/18 bg-[linear-gradient(180deg,rgba(8,28,26,0.96),rgba(7,16,18,0.96))] px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-white/42">
                Availability
              </p>
              <p className="text-[1.95rem] font-semibold tracking-[-0.05em] text-emerald-400">
                99.95%
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-7 left-8 rounded-[1.25rem] border border-red-400/16 bg-[linear-gradient(180deg,rgba(34,14,14,0.96),rgba(18,9,12,0.96))] px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 text-red-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-white/42">
                Active Incidents
              </p>
              <p className="text-xl font-semibold tracking-[-0.04em] text-red-300">
                12 Incidents
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 top-1/2 rounded-[1.25rem] border border-violet-400/16 bg-[linear-gradient(180deg,rgba(21,16,39,0.96),rgba(13,10,24,0.96))] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-300">
            <BrainCircuit className="h-4 w-4" />
            AI Analyzing...
          </div>
        </div>

        <div className="pointer-events-none absolute -left-8 top-[49%] rounded-[1.2rem] border border-orange-300/16 bg-[linear-gradient(180deg,rgba(35,20,11,0.96),rgba(16,10,8,0.96))] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-200">
            <ShieldAlert className="h-4 w-4" />
            Priority Watch
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MiniStatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "green" | "orange";
}) {
  return (
    <div
      className={`rounded-[1.2rem] border p-4 ${
        tone === "green"
          ? "border-emerald-400/16 bg-emerald-500/[0.05]"
          : "border-orange-300/16 bg-orange-500/[0.05]"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.08em] text-white/42">
        {title}
      </p>
      <p
        className={`mt-2 text-[2rem] font-semibold tracking-[-0.05em] ${
          tone === "green" ? "text-emerald-400" : "text-orange-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IncidentRow({
  tone,
  label,
  code,
  text,
}: {
  tone: "red" | "orange" | "neutral";
  label: string;
  code: string;
  text: string;
}) {
  const badgeClass =
    tone === "red"
      ? "bg-red-500 text-white"
      : tone === "orange"
      ? "bg-orange-500 text-white"
      : "bg-white/10 text-white/78";

  return (
    <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.01))] px-4 py-3">
      <span
        className={`rounded-[0.65rem] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${badgeClass}`}
      >
        {label}
      </span>
      <span className="text-[11px] text-white/42">{code}</span>
      <span className="text-sm text-white/74">{text}</span>
      <Activity className="ml-auto h-4 w-4 text-white/28" />
    </div>
  );
}