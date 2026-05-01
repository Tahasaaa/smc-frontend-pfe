import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Monitoring", href: "#monitoring" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,2,2,0.92),rgba(6,8,18,0.86))] shadow-[0_16px_42px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          : "border-b border-white/6 bg-[linear-gradient(180deg,rgba(2,2,2,0.78),rgba(6,8,18,0.58))] backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[6%] top-[-28px] h-24 w-24 rounded-full bg-[#f37c03]/10 blur-3xl" />
        <div className="absolute right-[12%] top-[-20px] h-20 w-28 rounded-full bg-[#f5916f]/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.38),transparent)]" />
      </div>

      <div className="mx-auto flex h-[78px] w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="group relative flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1rem] border border-[#f37c03]/20 bg-[linear-gradient(180deg,rgba(243,124,3,0.18),rgba(243,124,3,0.06))] shadow-[0_0_26px_rgba(243,124,3,0.12)] transition duration-300 group-hover:border-[#f37c03]/30 group-hover:shadow-[0_0_30px_rgba(243,124,3,0.16)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_42%)]" />
            <img
              src="/Orange_Logo.svg"
              alt="Orange"
              className="relative z-10 h-full w-full object-cover"
            />
          </div>

          <div className="leading-tight">
            <p className="text-[1.02rem] font-semibold tracking-[-0.035em] text-white">
              SMC QoS Platform
            </p>
            <p className="text-[0.84rem] text-[#ffd7b8]">
              Orange Tunisia · NOC
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative rounded-full px-4 py-2 text-sm font-medium tracking-[-0.01em] text-white/72 transition hover:bg-white/[0.05] hover:text-white"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,#f37c03,#f5916f,#ffb347)] transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 text-sm font-medium text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-[1px] hover:border-[#f37c03]/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]"
          >
            Login
          </Link>

          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-[#f37c03]/20 bg-[linear-gradient(90deg,#f37c03,#f5916f,#ffb347)] px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(243,124,3,0.24)] transition hover:-translate-y-[1px] hover:brightness-105"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Link
          to="/login"
          className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[#f37c03]/20 bg-[linear-gradient(90deg,#f37c03,#f5916f,#ffb347)] px-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(243,124,3,0.24)] md:hidden"
        >
          Login
        </Link>
      </div>
    </header>
  );
}