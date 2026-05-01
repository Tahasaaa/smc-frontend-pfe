import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import L from "leaflet";

import { getMapData } from "@/services/dashboard";
import {
  getRegionColor,
  getRegionFillOpacity,
  getRegionStatus,
  getRegionStatusLabel,
  getRegionStrokeColor,
  type RegionStatus,
} from "@/services/map";
import {
  REGION_CODE_TO_NAME,
  resolveRegionName,
} from "@/lib/regionMapping";

type MapRegion = {
  region_code: string;
  health_score: number;
};

type HoveredRegion = {
  name: string;
  healthScore: number;
  status: RegionStatus;
};

type RankedRegion = {
  name: string;
  healthScore: number;
  status: RegionStatus;
};

export default function TunisiaMapPanel() {
  const [geoData, setGeoData] = useState<any>(null);
  const [data, setData] = useState<MapRegion[]>([]);
  const [error, setError] = useState("");
  const [hoveredRegionName, setHoveredRegionName] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<HoveredRegion | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError("");

        const [geoResponse, apiData] = await Promise.all([
          fetch("/geo/tunisia_regions.geojson"),
          getMapData(),
        ]);

        if (!geoResponse.ok) {
          throw new Error("Failed to load Tunisia GeoJSON file.");
        }

        const geoJson = await geoResponse.json();
        setGeoData(geoJson);
        setData(apiData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load map data.";
        setError(message);
      }
    }

    load();
  }, []);

  const regionsByNormalizedName = useMemo(() => {
    const map = new Map<string, MapRegion>();

    for (const region of data) {
      const mappedName = REGION_CODE_TO_NAME[region.region_code];
      if (!mappedName) continue;

      map.set(resolveRegionName(mappedName), region);
    }

    return map;
  }, [data]);

  const counts = useMemo(() => {
    let stable = 0;
    let watch = 0;
    let alert = 0;

    for (const region of data) {
      const status = getRegionStatus(safeNumber(region.health_score));

      if (status === "good") stable += 1;
      else if (status === "warning") watch += 1;
      else alert += 1;
    }

    return { stable, watch, alert };
  }, [data]);

  const weakestRegions = useMemo<RankedRegion[]>(() => {
    return [...data]
      .map((region) => {
        const mappedName = REGION_CODE_TO_NAME[region.region_code] || region.region_code;
        const score = safeNumber(region.health_score);
        const status = getRegionStatus(score);

        return {
          name: mappedName,
          healthScore: score,
          status,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 3);
  }, [data]);

  const topSummary = useMemo(() => {
    if (!weakestRegions.length) {
      return null;
    }

    return weakestRegions[0];
  }, [weakestRegions]);

  function getRegionFromFeature(feature: any) {
    const rawName =
      feature?.properties?.NAME_1 ||
      feature?.properties?.name ||
      feature?.properties?.region ||
      "";

    const normalized = resolveRegionName(rawName);
    const matched = regionsByNormalizedName.get(normalized);

    return {
      rawName,
      normalized,
      region: matched,
    };
  }

  function getStyle(feature: any): PathOptions {
    const { rawName, region } = getRegionFromFeature(feature);
    const isHovered = hoveredRegionName === rawName;

    if (!region) {
      return {
        fillColor: "#151c25",
        weight: isHovered ? 2.1 : 1.15,
        color: isHovered ? "#f8fafc" : "#273241",
        fillOpacity: isHovered ? 0.58 : 0.34,
      };
    }

    const status = getRegionStatus(safeNumber(region.health_score));

    return {
      fillColor: getRegionColor(status),
      weight: isHovered ? 2.2 : 1.2,
      color: isHovered ? "#f8fafc" : getRegionStrokeColor(status),
      fillOpacity: isHovered ? 0.96 : getRegionFillOpacity(status),
    };
  }

  function onEachFeature(feature: any, layer: Layer) {
    const { rawName, region, normalized } = getRegionFromFeature(feature);

    if (!rawName) return;

    (layer as L.Path).on({
      mouseover: (e: any) => {
        setHoveredRegionName(rawName);

        if (region) {
          const score = safeNumber(region.health_score);
          const status = getRegionStatus(score);

          setHoveredRegion({
            name: rawName,
            healthScore: score,
            status,
          });
        } else {
          setHoveredRegion({
            name: rawName,
            healthScore: 0,
            status: "critical",
          });

          console.warn("Unmatched GeoJSON region:", rawName, "=>", normalized);
        }

        e.target.setStyle({
          weight: 2.2,
          color: "#f8fafc",
          fillOpacity: 0.96,
        });

        if (typeof e.target.bringToFront === "function") {
          e.target.bringToFront();
        }
      },
      mouseout: (e: any) => {
        setHoveredRegionName(null);
        setHoveredRegion(null);
        e.target.setStyle(getStyle(feature));
      },
    });
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a1016] px-4 text-center text-sm text-white/55">
        {error}
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a1016] px-4 text-sm text-white/42">
        Loading territorial pressure preview...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-[linear-gradient(180deg,#081018_0%,#0a1119_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,121,0,0.08),transparent_26%),radial-gradient(circle_at_82%_82%,rgba(95,110,255,0.05),transparent_18%)]" />

      <div className="absolute left-3 top-3 z-[500] flex flex-wrap gap-2">
        <CountChip label="Stable" value={counts.stable} tone="good" />
        <CountChip label="Watch" value={counts.watch} tone="warning" />
        <CountChip label="Alert" value={counts.alert} tone="critical" />
      </div>

      <div className="absolute bottom-3 left-3 z-[500] min-w-[190px] max-w-[240px] rounded-[1rem] border border-white/[0.06] bg-[rgba(12,17,24,0.88)] px-3 py-2.5 shadow-[0_14px_28px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
          Degradation watchlist
        </p>

        <div className="mt-2.5 space-y-2">
          {weakestRegions.length === 0 ? (
            <p className="text-xs text-white/42">No regional summary available.</p>
          ) : (
            weakestRegions.map((region, index) => (
              <div
                key={`${region.name}-${index}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white/84">
                    {region.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/38">
                    {getRegionStatusLabel(region.status)}
                  </p>
                </div>

                <span className="text-sm font-semibold tracking-[-0.03em] text-white">
                  {region.healthScore.toFixed(1)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {hoveredRegion ? (
        <div className="absolute right-3 top-3 z-[500] min-w-[180px] rounded-[1rem] border border-white/[0.06] bg-[rgba(12,17,24,0.92)] px-3 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
            Region focus
          </p>

          <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white">
            {hoveredRegion.name}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <MiniInfoCard
              label="Health"
              value={hoveredRegion.healthScore.toFixed(1)}
            />
            <MiniInfoCard
              label="State"
              value={getRegionStatusLabel(hoveredRegion.status)}
              tone={hoveredRegion.status}
            />
          </div>
        </div>
      ) : topSummary ? (
        <div className="absolute right-3 top-3 z-[500] min-w-[180px] rounded-[1rem] border border-white/[0.06] bg-[rgba(12,17,24,0.92)] px-3 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
            Lowest posture
          </p>

          <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white">
            {topSummary.name}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <MiniInfoCard
              label="Health"
              value={topSummary.healthScore.toFixed(1)}
            />
            <MiniInfoCard
              label="State"
              value={getRegionStatusLabel(topSummary.status)}
              tone={topSummary.status}
            />
          </div>
        </div>
      ) : null}

      <MapContainer
        center={[34.1, 9.6]}
        zoom={6}
        minZoom={5}
        maxZoom={7}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        className="h-full w-full"
      >
        <GeoJSON
          key={data.length}
          data={geoData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}

function CountChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: RegionStatus;
}) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-red-500/20 bg-red-500/10 text-red-300";

  const dotClass =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "warning"
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${toneClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label} {value}
    </span>
  );
}

function MiniInfoCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: RegionStatus;
}) {
  const textClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warning"
      ? "text-amber-300"
      : tone === "critical"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="rounded-[0.85rem] border border-white/[0.06] bg-[#111822] px-2.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${textClass}`}>{value}</p>
    </div>
  );
}

function safeNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}