import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AlarmsPage() {
  return (
    <DashboardShell
      title="Alarms"
      subtitle="Active alerts & threshold violations"
    >
      <div className="rounded-3xl border border-black/5 bg-white p-8 text-slate-600">
        Alarms page placeholder
      </div>
    </DashboardShell>
  );
}