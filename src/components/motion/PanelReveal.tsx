import type { ReactNode } from "react";

type PanelRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export default function PanelReveal({
  children,
  className = "",
  delayMs = 0,
}: PanelRevealProps) {
  return (
    <div
      className={["panel-reveal", className].join(" ")}
      style={{
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}