import { useMemo, type ReactNode } from "react";
import {
  CalendarDays,
  Crosshair,
  RadioTower,
  Search,
  ShieldCheck,
  Signal,
} from "lucide-react";

import type { MonitoringGlobalFilters } from "@/types/monitoring";

type Props = {
  filters: MonitoringGlobalFilters;
  filterOptions?: unknown;
  onChange: <K extends keyof MonitoringGlobalFilters>(
    key: K,
    value: MonitoringGlobalFilters[K]
  ) => void;
};

const KPI_OPTIONS = [
  { value: "avg_cssr_ps", label: "CSSR-PS" },
  { value: "avg_ps_rab_sr", label: "PS RAB SR" },
  { value: "avg_throughput", label: "Throughput" },
  { value: "avg_iub_congestion", label: "IUB Congestion" },
  { value: "avg_call_drop_dch", label: "Call Drop DCH" },
];

const DATE_RANGE_OPTIONS = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

export default function MonitoringGlobalControls({
  filters,
  filterOptions,
  onChange,
}: Props) {
  const regionOptions = useMemo(() => {
    return getStringOptions(filterOptions, [
      "regions",
      "regionOptions",
      "region_codes",
      "regionCodes",
    ]);
  }, [filterOptions]);

  const rncOptions = useMemo(() => {
    return getStringOptions(filterOptions, [
      "rncs",
      "rncOptions",
      "rnc_names",
      "rncNames",
    ]);
  }, [filterOptions]);

  const kpiOptions = useMemo(() => {
    const fromApi = getKpiOptions(filterOptions);
    return fromApi.length > 0 ? fromApi : KPI_OPTIONS;
  }, [filterOptions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[250px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <FilterField label="Technology">
          <div className="flex h-11 items-center justify-between rounded-[0.95rem] border border-emerald-500/16 bg-emerald-500/[0.07] px-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] border border-emerald-500/18 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-semibold text-white">3G</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-300/70">
                  Live scope
                </p>
              </div>
            </div>

            <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-white/42">
              locked
            </span>
          </div>
        </FilterField>

        <FilterField label="Region">
          <SelectControl
            value={filters.region_code || ""}
            onChange={(value) => onChange("region_code", value)}
            options={regionOptions}
            placeholder="All regions"
          />
        </FilterField>

        <FilterField label="RNC">
          <SelectControl
            value={filters.rnc || ""}
            onChange={(value) => onChange("rnc", value)}
            options={rncOptions}
            placeholder="All RNCs"
          />
        </FilterField>

        <FilterField label="Date Range">
          <SelectControl
            value={filters.dateRange || "24h"}
            onChange={(value) =>
              onChange("dateRange", value as MonitoringGlobalFilters["dateRange"])
            }
            options={DATE_RANGE_OPTIONS}
            placeholder="24H"
          />
        </FilterField>

        <FilterField label="KPI Focus">
          <SelectControl
            value={filters.kpiFocus || "avg_cssr_ps"}
            onChange={(value) => onChange("kpiFocus", value)}
            options={kpiOptions}
            placeholder="CSSR-PS"
          />
        </FilterField>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ScopeChip
          icon={<Signal className="h-3.5 w-3.5 text-emerald-300" />}
          label="Scope"
          value="3G live"
        />

        <ScopeChip
          icon={<Crosshair className="h-3.5 w-3.5 text-[#ff7900]" />}
          label="Region"
          value={filters.region_code || "All regions"}
        />

        <ScopeChip
          icon={<RadioTower className="h-3.5 w-3.5 text-[#ff7900]" />}
          label="RNC"
          value={filters.rnc || "All RNCs"}
        />

        <ScopeChip
          icon={<CalendarDays className="h-3.5 w-3.5 text-[#ff7900]" />}
          label="Window"
          value={formatDateRange(filters.dateRange)}
        />

        <ScopeChip
          icon={<Search className="h-3.5 w-3.5 text-[#ff7900]" />}
          label="Focus"
          value={formatKpi(filters.kpiFocus)}
        />
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="orange-ring-focus h-11 w-full rounded-[0.95rem] border border-white/10 bg-[#101925] px-4 text-sm font-medium text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
    >
      <option value="">{placeholder}</option>

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ScopeChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-medium text-white/58">
      {icon}
      <span className="text-white/34">{label}</span>
      <span className="text-white/78">{value}</span>
    </span>
  );
}

function getStringOptions(
  source: unknown,
  keys: string[]
): Array<{ value: string; label: string }> {
  if (!source || typeof source !== "object") return [];

  const objectSource = source as Record<string, unknown>;

  for (const key of keys) {
    const raw = objectSource[key];

    if (!Array.isArray(raw)) continue;

    return raw
      .map((item) => {
        if (typeof item === "string") {
          return {
            value: item,
            label: formatOptionLabel(item),
          };
        }

        if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          const value =
            String(itemObj.value ?? itemObj.code ?? itemObj.name ?? "").trim();
          const label =
            String(itemObj.label ?? itemObj.name ?? itemObj.code ?? value).trim();

          if (!value) return null;

          return {
            value,
            label,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{ value: string; label: string }>;
  }

  return [];
}

function getKpiOptions(
  source: unknown
): Array<{ value: string; label: string }> {
  const options = getStringOptions(source, [
    "kpis",
    "kpiOptions",
    "metrics",
    "metricOptions",
  ]);

  if (options.length === 0) return [];

  return options.map((option) => ({
    value: option.value,
    label: formatKpi(option.value),
  }));
}

function formatOptionLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateRange(value?: string) {
  if (value === "24h") return "24H";
  if (value === "7d") return "7D";
  if (value === "30d") return "30D";
  return value || "24H";
}

function formatKpi(value?: string) {
  if (!value) return "CSSR-PS";

  return value
    .replace(/^avg_/i, "")
    .replace(/_/g, " ")
    .replace(/\bcssr\b/i, "CSSR")
    .replace(/\bps\b/i, "PS")
    .replace(/\brab\b/i, "RAB")
    .replace(/\biub\b/i, "IUB")
    .replace(/\bdch\b/i, "DCH")
    .replace(/\btput\b/i, "TPUT")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}