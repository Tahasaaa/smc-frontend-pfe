import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

type FooterColumnProps = {
  title: string;
  items: string[];
};

type SocialIconProps = {
  link: string;
  children: React.ReactNode;
};

export default function Footer() {
  return (
    <footer
      id="contact"
      className="scroll-mt-28 relative overflow-hidden border-t border-white/8 px-6 pb-10 pt-20 text-white lg:px-8"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020202_0%,#050816_46%,#020202_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.12]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(243,124,3,0.10),transparent_22%),radial-gradient(circle_at_82%_78%,rgba(245,145,111,0.06),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(255,179,71,0.05),transparent_24%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,124,3,0.32),transparent)]" />
      <div className="absolute left-[6%] top-[12%] h-36 w-36 rounded-full bg-[#f37c03]/12 blur-3xl" />
      <div className="absolute right-[8%] top-[14%] h-40 w-40 rounded-full bg-[#f5916f]/10 blur-3xl" />
      <div className="absolute bottom-[-6%] left-[36%] h-44 w-44 rounded-full bg-[#ffb347]/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1rem] border border-[#f37c03]/18 bg-[linear-gradient(180deg,rgba(243,124,3,0.18),rgba(243,124,3,0.06))] shadow-[0_0_26px_rgba(243,124,3,0.12)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_42%)]" />
                <img
                  src="/Orange_small.png"
                  alt="Orange Tunisie"
                  className="relative z-10 h-full w-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
                  SMC <span className="text-[#ffd7b8]">QoS</span>
                </h2>
                <p className="text-sm text-white/48">Smart Monitoring Platform</p>
              </div>
            </div>

            <p className="mt-6 text-[15px] leading-8 text-white/60">
              Smart Monitoring & QoS Platform for telecom infrastructure,
              designed to support monitoring, automation, and operational
              intelligence in real time.
            </p>

            <div className="mt-8">
              <p className="mb-4 text-sm font-medium text-white/80">Follow us</p>
              <div className="flex flex-wrap gap-3">
                <SocialIcon link="https://x.com/orangetn">
                  <FaXTwitter size={16} />
                </SocialIcon>
                <SocialIcon link="https://www.facebook.com/orange.tn">
                  <FaFacebookF size={16} />
                </SocialIcon>
                <SocialIcon link="https://www.instagram.com/orange_tunisie">
                  <FaInstagram size={16} />
                </SocialIcon>
                <SocialIcon link="https://www.tiktok.com/@orange_tunisie">
                  <FaTiktok size={16} />
                </SocialIcon>
                <SocialIcon link="https://www.linkedin.com/company/orange-tunisie">
                  <FaLinkedinIn size={16} />
                </SocialIcon>
                <SocialIcon link="https://www.youtube.com/channel/UCjDETYn6oN5z4XmJMB91QSg">
                  <FaYoutube size={16} />
                </SocialIcon>
              </div>
            </div>
          </div>

          <FooterColumn
            title="Platform"
            items={["Monitoring", "Incidents", "Analytics", "AI Assistant"]}
          />

          <FooterColumn
            title="Resources"
            items={["Documentation", "Reports", "Support", "Updates"]}
          />

          <FooterColumn
            title="Contact"
            items={[
              "contact@smcqos.tn",
              "+216 XX XXX XXX",
              "Tunis, Tunisia",
              "Orange Tunisia NOC",
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 text-sm text-white/42 md:flex-row md:items-center">
          <p>© 2026 SMC QoS Platform. All rights reserved.</p>
          <p>
            Designed for modern telecom operations by{" "}
            <span className="font-medium text-[#ffd7b8]">Young Developers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
        {title}
      </h3>
      <ul className="mt-5 space-y-3 text-[15px] text-white/56">
        {items.map((item, i) => (
          <li key={i} className="transition hover:text-[#ffd7b8]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ link, children }: SocialIconProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-[1px] hover:border-[#f37c03]/16 hover:bg-[linear-gradient(180deg,rgba(243,124,3,0.10),rgba(243,124,3,0.03))] hover:text-[#ffd7b8]"
    >
      {children}
    </a>
  );
}