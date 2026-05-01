import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { DivIcon as LeafletDivIcon, LatLngBoundsExpression } from "leaflet";
import L from "leaflet";

import towerIcon from "@/assets/tower-broadcast-solid-full.svg";
import { buildMetricColor } from "@/components/map/cartographyColorScale";
import type {
  CartographyMetricMode,
  CartographySiteMarker,
  CartographyTooltipState,
} from "@/types/cartography";

type TunisiaSiteMapProps = {
  sites: CartographySiteMarker[];
  loading?: boolean;
  metricMode: CartographyMetricMode;
  selectedNodebName?: string | null;
  onHoverSite?: (tooltip: CartographyTooltipState) => void;
  onLeaveSite?: () => void;
  onSelectSite?: (site: CartographySiteMarker) => void;
};

const DEFAULT_CENTER: [number, number] = [34.1, 9.4];
const DEFAULT_ZOOM = 7;
const TOWER_ICON_ZOOM = 8.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildCircleRadius(
  site: CartographySiteMarker,
  metricMode: CartographyMetricMode
) {
  let radius = 4.2;

  if (metricMode === "health") {
    const health = site.health_score ?? 0;
    if (health < 80) radius = 6.8;
    else if (health < 90) radius = 5.2;
    else radius = 4.1;
  } else {
    radius = 4.6;
  }

  if (site.critical_incident_count > 0) radius += 1.4;
  else if (site.active_incident_count > 0) radius += 0.7;

  return clamp(radius, 3.8, 8.4);
}

function buildTowerSize(
  site: CartographySiteMarker,
  metricMode: CartographyMetricMode
) {
  let size = 15;

  if (metricMode === "health") {
    const health = site.health_score ?? 0;
    if (health < 80) size = 20;
    else if (health < 90) size = 17;
    else size = 14.5;
  } else {
    size = 15.5;
  }

  if (site.critical_incident_count > 0) size += 3.5;
  else if (site.active_incident_count > 0) size += 1.8;

  return clamp(size, 13, 24);
}

function getMetricModeLabel(metricMode: CartographyMetricMode) {
  if (metricMode === "health") return "Health mode";
  if (metricMode === "cssr") return "CSSR mode";
  if (metricMode === "throughput") return "Throughput mode";
  if (metricMode === "iub") return "IUB mode";
  return "Drop rate mode";
}

function svgColorFilter(color: string) {
  if (color === "#34d399") {
    return "invert(72%) sepia(26%) saturate(866%) hue-rotate(96deg) brightness(91%) contrast(88%)";
  }
  if (color === "#f59e0b") {
    return "invert(73%) sepia(59%) saturate(1628%) hue-rotate(357deg) brightness(97%) contrast(93%)";
  }
  if (color === "#ef4444") {
    return "invert(44%) sepia(94%) saturate(1787%) hue-rotate(333deg) brightness(97%) contrast(93%)";
  }
  return "invert(69%) sepia(9%) saturate(467%) hue-rotate(174deg) brightness(88%) contrast(86%)";
}

function createTowerDivIcon(
  site: CartographySiteMarker,
  metricMode: CartographyMetricMode,
  isSelected: boolean
): LeafletDivIcon {
  const color = buildMetricColor(site, metricMode);
  const size = buildTowerSize(site, metricMode);
  const hasIncident = site.active_incident_count > 0;
  const hasCriticalIncident = site.critical_incident_count > 0;

  const html = `
    <div style="position:relative; width:${size + 10}px; height:${size + 10}px; display:flex; align-items:center; justify-content:center;">
      <span style="
        position:absolute;
        inset:1px;
        border-radius:999px;
        background:radial-gradient(circle, ${color}22 0%, transparent 68%);
        filter:blur(1px);
      "></span>
      <img
        src="${towerIcon}"
        alt=""
        style="
          width:${size}px;
          height:${size}px;
          display:block;
          position:relative;
          z-index:2;
          user-select:none;
          -webkit-user-drag:none;
          filter:
            drop-shadow(0 3px 8px rgba(0,0,0,0.42))
            ${svgColorFilter(color)};
          opacity:1;
        "
      />
      ${
        hasIncident
          ? `<span style="
              position:absolute;
              inset:0px;
              border-radius:999px;
              border:1.4px solid ${color};
              opacity:${hasCriticalIncident ? 0.82 : 0.42};
              z-index:1;
            "></span>`
          : ""
      }
      ${
        isSelected
          ? `<span style="
              position:absolute;
              inset:-1px;
              border-radius:999px;
              border:2px solid rgba(255,255,255,0.95);
              box-shadow:0 0 0 5px ${color}33, 0 0 24px ${color}80;
              z-index:0;
            "></span>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: "cartography-leaflet-tower-marker",
    iconSize: [size + 10, size + 10],
    iconAnchor: [(size + 10) / 2, (size + 10) / 2],
  });
}

function buildBounds(sites: CartographySiteMarker[]): LatLngBoundsExpression | null {
  const valid = sites.filter(
    (site) =>
      typeof site.latitude === "number" &&
      typeof site.longitude === "number" &&
      Number.isFinite(site.latitude) &&
      Number.isFinite(site.longitude)
  );

  if (!valid.length) return null;

  return valid.map((site) => [site.latitude, site.longitude]) as [number, number][];
}

function FitToSites({
  sites,
  selectedNodebName,
}: {
  sites: CartographySiteMarker[];
  selectedNodebName?: string | null;
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    const observer = new ResizeObserver(() => invalidate());
    const container = map.getContainer();
    observer.observe(container);

    const t1 = window.setTimeout(invalidate, 80);
    const t2 = window.setTimeout(invalidate, 220);

    window.addEventListener("resize", invalidate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    const bounds = buildBounds(sites);
    if (!bounds || hasFittedRef.current) return;

    map.fitBounds(bounds, {
      padding: [52, 52],
      maxZoom: 8.2,
      animate: false,
    });

    hasFittedRef.current = true;
  }, [map, sites]);

  useEffect(() => {
    if (!selectedNodebName) return;

    const selectedSite = sites.find(
      (site) => site.nodeb_name === selectedNodebName
    );
    if (!selectedSite) return;

    map.flyTo(
      [selectedSite.latitude, selectedSite.longitude],
      Math.max(map.getZoom(), 7.8),
      { duration: 0.45 }
    );
  }, [map, selectedNodebName, sites]);

  return null;
}

function MarkerLayer({
  sites,
  metricMode,
  selectedNodebName,
  onHoverSite,
  onLeaveSite,
  onSelectSite,
}: {
  sites: CartographySiteMarker[];
  metricMode: CartographyMetricMode;
  selectedNodebName?: string | null;
  onHoverSite?: (tooltip: CartographyTooltipState) => void;
  onLeaveSite?: () => void;
  onSelectSite?: (site: CartographySiteMarker) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  const useTowerIcons = zoom >= TOWER_ICON_ZOOM;

  return (
    <>
      {sites.map((site) => {
        const isSelected = selectedNodebName === site.nodeb_name;
        const color = buildMetricColor(site, metricMode);

        const commonHandlers = {
          mouseover: (event: any) => {
            const mapContainer =
              event.target?._map?.getContainer?.() as HTMLElement | undefined;
            const original = event.originalEvent as MouseEvent | undefined;

            if (!mapContainer || !original) return;

            const rect = mapContainer.getBoundingClientRect();

            onHoverSite?.({
              x: original.clientX - rect.left,
              y: original.clientY - rect.top,
              site,
            });
          },
          mousemove: (event: any) => {
            const mapContainer =
              event.target?._map?.getContainer?.() as HTMLElement | undefined;
            const original = event.originalEvent as MouseEvent | undefined;

            if (!mapContainer || !original) return;

            const rect = mapContainer.getBoundingClientRect();

            onHoverSite?.({
              x: original.clientX - rect.left,
              y: original.clientY - rect.top,
              site,
            });
          },
          mouseout: () => {
            onLeaveSite?.();
          },
          click: () => {
            onSelectSite?.(site);
          },
        };

        if (useTowerIcons) {
          return (
            <Marker
              key={`${site.nodeb_name}-${site.latitude}-${site.longitude}`}
              position={[site.latitude, site.longitude]}
              icon={createTowerDivIcon(site, metricMode, isSelected)}
              eventHandlers={commonHandlers}
            />
          );
        }

        const radius = buildCircleRadius(site, metricMode);

        return (
          <CircleMarker
            key={`${site.nodeb_name}-${site.latitude}-${site.longitude}`}
            center={[site.latitude, site.longitude]}
            radius={isSelected ? radius + 1 : radius}
            pathOptions={{
              color: isSelected ? "#ffffff" : color,
              weight: isSelected ? 2.8 : 1.4,
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.9,
            }}
            eventHandlers={commonHandlers}
          />
        );
      })}
    </>
  );
}

export default function TunisiaSiteMap({
  sites,
  loading = false,
  metricMode,
  selectedNodebName,
  onHoverSite,
  onLeaveSite,
  onSelectSite,
}: TunisiaSiteMapProps) {
  const validSites = useMemo(() => {
    return sites.filter(
      (site) =>
        typeof site.latitude === "number" &&
        typeof site.longitude === "number" &&
        Number.isFinite(site.latitude) &&
        Number.isFinite(site.longitude)
    );
  }, [sites]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#08111a]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={12}
        scrollWheelZoom
        zoomControl={true}
        attributionControl={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", background: "#08111a" }}
      >
        <FitToSites sites={validSites} selectedNodebName={selectedNodebName} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerLayer
          sites={validSites}
          metricMode={metricMode}
          selectedNodebName={selectedNodebName}
          onHoverSite={onHoverSite}
          onLeaveSite={onLeaveSite}
          onSelectSite={onSelectSite}
        />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-[linear-gradient(180deg,rgba(8,17,26,0.72),rgba(8,17,26,0))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-[linear-gradient(0deg,rgba(8,17,26,0.9),rgba(8,17,26,0))]" />

      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#08111a]/42 backdrop-blur-[1px]">
          <div className="rounded-[1.15rem] border border-white/[0.08] bg-[#0f1722]/92 px-5 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
            <div className="mx-auto h-10 w-10 animate-pulse rounded-xl border border-[#ff7900]/30 bg-[#ff7900]/10" />
            <p className="mt-3 text-sm font-medium text-white">
              Refreshing site markers...
            </p>
            <p className="mt-1 text-xs text-white/45">
              Updating {getMetricModeLabel(metricMode).toLowerCase()}.
            </p>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-[0.9rem] border border-white/[0.06] bg-[#0f1722]/88 px-3 py-2 text-[11px] text-white/42 backdrop-blur-sm">
        OSM basemap · {sites.length} visible 3G sites · {getMetricModeLabel(metricMode)}
      </div>

      {selectedNodebName ? (
        <div className="pointer-events-none absolute bottom-14 left-3 rounded-[0.9rem] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300 backdrop-blur-sm">
          Selected: {selectedNodebName}
        </div>
      ) : null}
    </div>
  );
}