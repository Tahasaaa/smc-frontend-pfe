import { useEffect, useMemo, useState } from "react";

type AppBootScreenProps = {
  visible?: boolean;
  title?: string;
  subtitle?: string;
  durationMs?: number;
  onComplete?: () => void;
};

const DEFAULT_MESSAGES = [
  "Mounting dashboard shell",
  "Loading observability services",
  "Syncing incident workspace",
  "Preparing monitoring grid",
  "Finalizing operator console",
];

export default function AppBootScreen({
  visible = true,
  title = "SMC QoS Cockpit",
  subtitle = "Network Operations Console",
  durationMs = 2600,
  onComplete,
}: AppBootScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(() => DEFAULT_MESSAGES, []);

  useEffect(() => {
    if (!visible) return;

    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(nextProgress);

      const nextStep = Math.min(
        steps.length - 1,
        Math.floor((nextProgress / 100) * steps.length)
      );
      setActiveStep(nextStep);

      if (nextProgress >= 100) {
        window.clearInterval(tick);
        window.setTimeout(() => {
          onComplete?.();
        }, 240);
      }
    }, 40);

    return () => window.clearInterval(tick);
  }, [durationMs, onComplete, steps.length, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#05080d] text-white">
      <div className="pointer-events-none absolute inset-0 boot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 boot-vignette" />
      <div className="pointer-events-none absolute inset-0 boot-scanlines opacity-20" />

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-6 text-center">
        <div className="boot-logo-ring mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_40px_rgba(255,121,0,0.08)]">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-md border border-[#ff7900]/40" />
            <div className="h-4 w-4 rounded-sm bg-[#ff7900]" />
          </div>
        </div>

        <div className="boot-fade-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
            System Boot Sequence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/50 md:text-base">{subtitle}</p>
        </div>

        <div className="mt-10 w-full rounded-2xl border border-white/[0.06] bg-[#0c1219]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.28)] boot-fade-up-delay">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-white/40">
            <span>Initializing modules</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
            <div
              className="boot-progress h-full rounded-full bg-[#ff7900] transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 space-y-2 text-left">
            {steps.map((message, index) => {
              const isActive = index <= activeStep;
              return (
                <div
                  key={message}
                  className={[
                    "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-all duration-300",
                    isActive ? "bg-white/[0.03] text-white/82" : "text-white/28",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-2 w-2 rounded-full transition-all duration-300",
                      isActive ? "bg-[#ff7900] shadow-[0_0_10px_rgba(255,121,0,0.5)]" : "bg-white/15",
                    ].join(" ")}
                  />
                  <span>{message}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/25 boot-fade-up-delay-2">
          Operator console startup
        </div>
      </div>
    </div>
  );
}