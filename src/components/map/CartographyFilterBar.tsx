import { Check, ChevronDown, RotateCcw } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import type {
  CartographyFilterOptions,
  CartographyFilters,
} from "@/types/cartography";

type CartographyFilterBarProps = {
  filters: CartographyFilters;
  filterOptions: CartographyFilterOptions | null;
  onChange: <K extends keyof CartographyFilters>(
    key: K,
    value: CartographyFilters[K]
  ) => void;
  onReset?: () => void;
};

type OpenMenuId = "date" | "rnc" | "status" | null;

export default function CartographyFilterBar({
  filters,
  filterOptions,
  onChange,
  onReset,
}: CartographyFilterBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenuId>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!controlsRef.current) return;
      if (!controlsRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <section className="premium-panel rounded-[1.3rem]">
      <div ref={controlsRef} className="premium-panel-body px-4 py-3.5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterDropdown
            id="date"
            label="Date"
            value={filters.date}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            options={filterOptions?.dates ?? []}
            placeholder="All dates"
            onSelect={(value) => onChange("date", value)}
          />

          <FilterDropdown
            id="rnc"
            label="RNC"
            value={filters.rnc_name}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            options={filterOptions?.rnc_names ?? []}
            placeholder="All RNCs"
            onSelect={(value) => onChange("rnc_name", value)}
          />

          <FilterDropdown
            id="status"
            label="Status"
            value={filters.status}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            options={filterOptions?.statuses ?? []}
            placeholder="All statuses"
            onSelect={(value) => onChange("status", value)}
            formatOption={(value) => formatStatusLabel(value)}
          />

          <div className="flex items-end justify-end">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="premium-button-ghost orange-ring-focus h-[42px] text-white/78 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <ContextPill label="Date" value={filters.date || "All dates"} />
          <ContextPill label="RNC" value={filters.rnc_name || "All RNCs"} />
          <ContextPill
            label="Status"
            value={filters.status ? formatStatusLabel(filters.status) : "All statuses"}
          />
        </div>
      </div>
    </section>
  );
}

function FilterDropdown({
  id,
  label,
  value,
  openMenu,
  setOpenMenu,
  options,
  placeholder,
  onSelect,
  formatOption,
}: {
  id: Exclude<OpenMenuId, null>;
  label: string;
  value: string;
  openMenu: OpenMenuId;
  setOpenMenu: (value: OpenMenuId) => void;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  formatOption?: (value: string) => string;
}) {
  const isOpen = openMenu === id;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selectedLabel = value
    ? formatOption
      ? formatOption(value)
      : value
    : placeholder;

  const estimatedHeight = useMemo(() => {
    const rowCount = Math.max(options.length + 1, 1);
    return Math.min(280, rowCount * 44 + 16);
  }, [options.length]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    function updatePosition() {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight + 20 && rect.top > estimatedHeight + 20;

      const top = openUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8;

      setMenuStyle({
        top: Math.max(8, top),
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, estimatedHeight]);

  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpenMenu(isOpen ? null : id)}
        className={[
          "orange-ring-focus flex h-[42px] w-full items-center justify-between rounded-[0.95rem] border px-3.5 text-left text-sm transition",
          isOpen
            ? "border-[#ff7900]/30 bg-[#121d2a] text-white shadow-[0_0_0_1px_rgba(255,121,0,0.08)]"
            : "border-white/10 bg-[#101925] text-white hover:border-white/[0.14]",
        ].join(" ")}
      >
        <span className={value ? "text-white" : "text-white/42"}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 text-white/42 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && menuStyle
        ? createPortal(
            <div
              style={{
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
                zIndex: 9999,
              }}
              className="overflow-hidden rounded-[1rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,23,30,0.99),rgba(11,16,24,0.99))] shadow-[0_22px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            >
              <div className="max-h-[280px] overflow-auto p-1.5">
                <DropdownItem
                  selected={value === ""}
                  onClick={() => {
                    onSelect("");
                    setOpenMenu(null);
                  }}
                >
                  {placeholder}
                </DropdownItem>

                {options.map((option) => {
                  const selected = option === value;

                  return (
                    <DropdownItem
                      key={`${label}-${option}`}
                      selected={selected}
                      onClick={() => {
                        onSelect(option);
                        setOpenMenu(null);
                      }}
                    >
                      {formatOption ? formatOption(option) : option}
                    </DropdownItem>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function DropdownItem({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={[
        "flex w-full items-center justify-between rounded-[0.85rem] px-3 py-2.5 text-left text-sm transition",
        selected
          ? "bg-orange-500/12 text-orange-200"
          : "text-white/76 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      <span>{children}</span>
      {selected ? <Check className="h-4 w-4" /> : null}
    </button>
  );
}

function ContextPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="premium-toolbar-pill">
      <span className="text-white/34">{label}</span>
      <span className="text-white/78">{value}</span>
    </span>
  );
}

function formatStatusLabel(value: string) {
  if (value === "good") return "Stable";
  if (value === "warning") return "Watch";
  if (value === "critical") return "Alert";
  if (value === "unknown") return "Unknown";
  return value;
}