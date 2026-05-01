import FloatingLinesBackground from "./FloatingLinesBackground";

type AtmosphereVariant = "hero" | "tools" | "mission" | "features";

type SectionAtmosphereProps = {
  variant?: AtmosphereVariant;
  className?: string;
};

const variantConfig = {
  hero: {
    linesGradient: ["#f37c03", "#f5916f", "#ffb347", "#020202"],
    lineCount: [10, 15, 20],
    lineDistance: [7.5, 9, 11.5],
    animationSpeed: 1.15,
    bendRadius: 4.8,
    bendStrength: -0.45,
    parallaxStrength: 0.18,
    mixBlendMode: "screen" as const,
    topWavePosition: { x: 9.5, y: 0.65, rotate: -0.38 },
    middleWavePosition: { x: 5.25, y: 0.05, rotate: 0.18 },
    bottomWavePosition: { x: 2.0, y: -0.72, rotate: -0.92 },
    linesOpacityClass: "opacity-80",
    gridOpacityClass: "opacity-[0.16]",
  },
  tools: {
    linesGradient: ["#f37c03", "#f5916f", "#ffb347", "#020202"],
    lineCount: [7, 10, 14],
    lineDistance: [8.5, 10.5, 12.5],
    animationSpeed: 0.8,
    bendRadius: 4.2,
    bendStrength: -0.28,
    parallaxStrength: 0.12,
    mixBlendMode: "screen" as const,
    topWavePosition: { x: 8.8, y: 0.52, rotate: -0.25 },
    middleWavePosition: { x: 4.8, y: 0.02, rotate: 0.16 },
    bottomWavePosition: { x: 2.2, y: -0.68, rotate: -0.7 },
    linesOpacityClass: "opacity-60",
    gridOpacityClass: "opacity-[0.12]",
  },
  mission: {
    linesGradient: ["#f37c03", "#f5916f", "#ffb347", "#020202"],
    lineCount: [8, 12, 16],
    lineDistance: [8, 9.5, 11],
    animationSpeed: 0.92,
    bendRadius: 4.4,
    bendStrength: -0.34,
    parallaxStrength: 0.14,
    mixBlendMode: "screen" as const,
    topWavePosition: { x: 9.2, y: 0.58, rotate: -0.32 },
    middleWavePosition: { x: 5.0, y: 0.02, rotate: 0.18 },
    bottomWavePosition: { x: 2.0, y: -0.7, rotate: -0.82 },
    linesOpacityClass: "opacity-68",
    gridOpacityClass: "opacity-[0.13]",
  },
  features: {
    linesGradient: ["#f37c03", "#f5916f", "#ffb347", "#020202"],
    lineCount: [8, 11, 15],
    lineDistance: [8.2, 9.8, 11.6],
    animationSpeed: 0.88,
    bendRadius: 4.2,
    bendStrength: -0.32,
    parallaxStrength: 0.12,
    mixBlendMode: "screen" as const,
    topWavePosition: { x: 9.0, y: 0.55, rotate: -0.3 },
    middleWavePosition: { x: 5.0, y: 0.0, rotate: 0.18 },
    bottomWavePosition: { x: 2.0, y: -0.68, rotate: -0.76 },
    linesOpacityClass: "opacity-62",
    gridOpacityClass: "opacity-[0.11]",
  },
} satisfies Record<AtmosphereVariant, any>;

function variantGlowClasses(variant: AtmosphereVariant) {
  switch (variant) {
    case "hero":
      return {
        leftGlow:
          "absolute left-[-8%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-[#f37c03]/18 blur-3xl",
        centerGlow:
          "absolute left-1/2 top-[28%] h-[24rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#f5916f]/10 blur-3xl",
        rightGlow:
          "absolute right-[-6%] top-[12%] h-[26rem] w-[26rem] rounded-full bg-[#ffb347]/10 blur-3xl",
        bottomGlow:
          "absolute bottom-[-10%] left-[22%] h-[22rem] w-[22rem] rounded-full bg-[#f37c03]/10 blur-3xl",
      };
    case "tools":
      return {
        leftGlow:
          "absolute left-[4%] top-[22%] h-[18rem] w-[18rem] rounded-full bg-[#f37c03]/12 blur-3xl",
        centerGlow:
          "absolute left-1/2 top-[34%] h-[16rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#f5916f]/8 blur-3xl",
        rightGlow:
          "absolute right-[6%] top-[24%] h-[18rem] w-[18rem] rounded-full bg-[#ffb347]/8 blur-3xl",
        bottomGlow:
          "absolute bottom-[-14%] left-[38%] h-[14rem] w-[20rem] rounded-full bg-[#f37c03]/8 blur-3xl",
      };
    case "mission":
      return {
        leftGlow:
          "absolute left-[-4%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-[#f37c03]/14 blur-3xl",
        centerGlow:
          "absolute left-1/2 top-[18%] h-[18rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#f5916f]/8 blur-3xl",
        rightGlow:
          "absolute right-[2%] top-[48%] h-[20rem] w-[20rem] rounded-full bg-[#ffb347]/7 blur-3xl",
        bottomGlow:
          "absolute bottom-[-12%] left-[24%] h-[18rem] w-[24rem] rounded-full bg-[#f37c03]/8 blur-3xl",
      };
    default:
      return {
        leftGlow:
          "absolute left-[-5%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-[#f37c03]/12 blur-3xl",
        centerGlow:
          "absolute left-1/2 top-[16%] h-[16rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#f5916f]/8 blur-3xl",
        rightGlow:
          "absolute right-[0%] top-[60%] h-[20rem] w-[20rem] rounded-full bg-[#ffb347]/7 blur-3xl",
        bottomGlow:
          "absolute bottom-[-10%] left-[28%] h-[18rem] w-[22rem] rounded-full bg-[#f37c03]/7 blur-3xl",
      };
  }
}

export default function SectionAtmosphere({
  variant = "hero",
  className = "",
}: SectionAtmosphereProps) {
  const config = variantConfig[variant];
  const glows = variantGlowClasses(variant);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020202_0%,#050816_42%,#020202_100%)]" />

      <div className={glows.leftGlow} />
      <div className={glows.centerGlow} />
      <div className={glows.rightGlow} />
      <div className={glows.bottomGlow} />

      <div
        className={`absolute inset-0 ${config.gridOpacityClass} bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px]`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(255,121,0,0.08),transparent_28%)]" />

      <div className={`absolute inset-0 ${config.linesOpacityClass}`}>
        <FloatingLinesBackground
          linesGradient={config.linesGradient}
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={config.lineCount}
          lineDistance={config.lineDistance}
          animationSpeed={config.animationSpeed}
          interactive={true}
          bendRadius={config.bendRadius}
          bendStrength={config.bendStrength}
          parallax={true}
          parallaxStrength={config.parallaxStrength}
          mixBlendMode={config.mixBlendMode}
          topWavePosition={config.topWavePosition}
          middleWavePosition={config.middleWavePosition}
          bottomWavePosition={config.bottomWavePosition}
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,2,2,0.08),rgba(2,2,2,0.18)_38%,rgba(2,2,2,0.3)_100%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.34)]" />
    </div>
  );
}