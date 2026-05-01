import {
  ArrowLeft,
  Construction,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { TechnologyScope } from "@/stores/technologyScopeStore";

type Props = {
  technology: TechnologyScope;
  onReturnToLive?: () => void;
};

export default function ComingSoonScope({
  technology,
  onReturnToLive,
}: Props) {
  return (
    <div className="space-y-3 px-1 pb-3 pt-1 text-white">
      <section className="premium-panel overflow-hidden rounded-[1.6rem]">
        <div className="premium-panel-body relative min-h-[68vh] px-4 py-5 md:px-6 md:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,121,0,0.11),transparent_34%),radial-gradient(circle_at_22%_72%,rgba(56,189,248,0.08),transparent_30%)]" />

          <div className="relative z-10 flex min-h-[62vh] items-center justify-center">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.55rem] border border-orange-400/18 bg-[linear-gradient(180deg,rgba(255,121,0,0.18),rgba(255,255,255,0.035))] shadow-[0_22px_50px_rgba(255,121,0,0.12)]">
                <Construction className="h-9 w-9 text-[#ff7900]" />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                Technology Scope
              </p>

              <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white md:text-[2.65rem]">
                {technology} scope is coming soon
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/52">
                The {technology} operational workspace is not connected to a
                validated data layer yet. To avoid fake data, broken views, or
                misleading network posture, this scope is intentionally locked
                until implementation is ready.
              </p>

              <div className="mt-7 grid gap-3 text-left md:grid-cols-3">
                <ScopeInfoCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="No fake data"
                  text="Unavailable scopes stay clean instead of showing placeholder KPIs."
                />

                <ScopeInfoCard
                  icon={<RadioTower className="h-4 w-4" />}
                  title="3G is live"
                  text="Current operational dashboards remain focused on the implemented 3G scope."
                />

                <ScopeInfoCard
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Future ready"
                  text="The UI is prepared for 4G and 5G once backend data is validated."
                />
              </div>

              {onReturnToLive ? (
                <button
                  onClick={onReturnToLive}
                  className="premium-button orange-ring-focus mx-auto mt-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to 3G live scope
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScopeInfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-[#ff7900]">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">
          {title}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-white/44">{text}</p>
    </div>
  );
}