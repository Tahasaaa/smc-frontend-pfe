import { useSyncExternalStore } from "react";

export type TechnologyScope = "3G" | "4G" | "5G";

let technologyScope: TechnologyScope = "3G";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return technologyScope;
}

export function useTechnologyScope() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getTechnologyScope() {
  return technologyScope;
}

export function setTechnologyScope(nextScope: TechnologyScope) {
  technologyScope = nextScope;
  emitChange();
}

export function isLiveTechnologyScope(scope: TechnologyScope) {
  return scope === "3G";
}