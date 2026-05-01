import type { ReactNode } from "react";

type PageMotionProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export default function PageMotion({
  children,
  className = "",
  delayMs = 0,
}: PageMotionProps) {
  return (
    <div
      className={["page-motion", className].join(" ")}
      style={{
        animationDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}