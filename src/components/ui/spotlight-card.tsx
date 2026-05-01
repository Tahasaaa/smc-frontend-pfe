import React, { useEffect, useRef, type ReactNode } from "react";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
};

const glowColorMap = {
  blue: { base: 220, spread: 180 },
  purple: { base: 280, spread: 220 },
  green: { base: 138, spread: 160 },
  red: { base: 0, spread: 180 },
  orange: { base: 28, spread: 180 },
};

export function GlowCard({
  children,
  className = "",
  glowColor = "orange",
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      if (!cardRef.current) return;

      cardRef.current.style.setProperty("--x", x.toFixed(2));
      cardRef.current.style.setProperty("--xp", (x / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty("--y", y.toFixed(2));
      cardRef.current.style.setProperty("--yp", (y / window.innerHeight).toFixed(2));
    };

    document.addEventListener("pointermove", syncPointer);
    return () => document.removeEventListener("pointermove", syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const styles = {
    ["--base" as string]: base,
    ["--spread" as string]: spread,
    ["--radius" as string]: 24,
    ["--border" as string]: 1,
    ["--backdrop" as string]: "rgba(255,255,255,0.028)",
    ["--backup-border" as string]: "rgba(255,255,255,0.08)",
    ["--size" as string]: 180,
    ["--border-size" as string]: "calc(var(--border) * 1px)",
    ["--spotlight-size" as string]: "calc(var(--size) * 1px)",
    ["--hue" as string]:
      "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue) 100% 62% / 0.08), transparent 70%
    )`,
    backgroundColor: "var(--backdrop)",
    border: "1px solid var(--backup-border)",
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        [data-landing-glow] {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        [data-landing-glow]::before,
        [data-landing-glow]::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        [data-landing-glow]::before {
          padding: 1px;
          background:
            radial-gradient(
              calc(var(--spotlight-size) * 0.65) calc(var(--spotlight-size) * 0.65) at
              calc(var(--x, 0) * 1px)
              calc(var(--y, 0) * 1px),
              hsl(var(--hue) 100% 72% / 0.65),
              transparent 72%
            );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
        }

        [data-landing-glow]::after {
          background:
            radial-gradient(
              calc(var(--spotlight-size) * 0.45) calc(var(--spotlight-size) * 0.45) at
              calc(var(--x, 0) * 1px)
              calc(var(--y, 0) * 1px),
              rgba(255,255,255,0.06),
              transparent 68%
            );
          opacity: 0.7;
        }
      `}</style>

      <div
        ref={cardRef}
        data-landing-glow
        style={styles}
        className={`rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.01))] shadow-[0_18px_44px_rgba(0,0,0,0.22)] backdrop-blur-xl ${className}`}
      >
        {children}
      </div>
    </>
  );
}