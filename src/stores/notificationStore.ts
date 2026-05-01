import { useSyncExternalStore } from "react";

import { mockNotifications } from "@/data/notifications-mock";
import {
  createNotification,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationAsUnread,
  type CreateNotificationPayload,
} from "@/services/notificationService";
import type {
  AppNotification,
  NotificationSeverity,
  NotificationSource,
} from "@/types/notifications";

type AddNotificationInput = {
  title: string;
  message: string;
  severity?: NotificationSeverity;
  source?: NotificationSource;
  entityLabel?: string;
  action?: AppNotification["action"];
  metadata?: Record<string, unknown>;
};

export type NotificationToast = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  createdAt: string;
};

let notifications: AppNotification[] = [...mockNotifications];
let toasts: NotificationToast[] = [];
let loadingNotifications = false;
let notificationServiceReady = false;

const notificationListeners = new Set<() => void>();
const toastListeners = new Set<() => void>();

function emitNotificationChange() {
  notificationListeners.forEach((listener) => listener());
}

function emitToastChange() {
  toastListeners.forEach((listener) => listener());
}

function subscribeNotifications(listener: () => void) {
  notificationListeners.add(listener);

  return () => {
    notificationListeners.delete(listener);
  };
}

function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);

  return () => {
    toastListeners.delete(listener);
  };
}

function getNotificationSnapshot() {
  return notifications;
}

function getToastSnapshot() {
  return toasts;
}

function getStoredToken(): string | null {
  const directKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "access",
  ];

  for (const key of directKeys) {
    const value = localStorage.getItem(key);
    if (value && typeof value === "string") return value;
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const found = findTokenInObject(parsed);
      if (found) return found;
    } catch {
      // ignore parsing errors
    }
  }

  return null;
}

function findTokenInObject(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const candidateKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "access",
  ];

  const obj = value as Record<string, unknown>;

  for (const key of candidateKeys) {
    const candidate = obj[key];

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  for (const nested of Object.values(obj)) {
    if (typeof nested === "string" && nested.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(nested);
        const found = findTokenInObject(parsed);
        if (found) return found;
      } catch {
        // ignore nested parse error
      }
    }

    if (nested && typeof nested === "object") {
      const found = findTokenInObject(nested);
      if (found) return found;
    }
  }

  return null;
}

function normalizeNotification(input: AppNotification): AppNotification {
  return {
    ...input,
    entityLabel: input.entityLabel || undefined,
    action: input.action || undefined,
  };
}

function pushToast(notification: AppNotification) {
  const toast: NotificationToast = {
    id: `toast-${notification.id}-${Date.now()}`,
    title: notification.title,
    message: notification.message,
    severity: notification.severity,
    source: notification.source,
    createdAt: notification.createdAt,
  };

  toasts = [toast, ...toasts].slice(0, 4);
  emitToastChange();

  window.setTimeout(() => {
    dismissToast(toast.id);
  }, 4200);
}

export function useNotifications() {
  return useSyncExternalStore(
    subscribeNotifications,
    getNotificationSnapshot,
    getNotificationSnapshot
  );
}

export function useNotificationToasts() {
  return useSyncExternalStore(
    subscribeToasts,
    getToastSnapshot,
    getToastSnapshot
  );
}

export function isNotificationServiceReady() {
  return notificationServiceReady;
}

export function isLoadingNotifications() {
  return loadingNotifications;
}

export async function loadNotificationsFromBackend() {
  const token = getStoredToken();

  if (!token || loadingNotifications) {
    return notifications;
  }

  try {
    loadingNotifications = true;

    const backendNotifications = await getNotifications(token);
    notificationServiceReady = true;

    if (backendNotifications.length > 0) {
      notifications = backendNotifications.map(normalizeNotification);
    } else {
      // Keep existing demo notifications when DB is empty,
      // so the UI does not look dead during the PFE demo.
      notifications = [...mockNotifications];
    }

    emitNotificationChange();
    return notifications;
  } catch {
    notificationServiceReady = false;

    // Keep mock/existing notifications if backend is not reachable.
    if (notifications.length === 0) {
      notifications = [...mockNotifications];
      emitNotificationChange();
    }

    return notifications;
  } finally {
    loadingNotifications = false;
  }
}

export async function addNotification(input: AddNotificationInput) {
  const now = new Date().toISOString();
  const localId = `ntf-local-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

  const localNotification: AppNotification = {
    id: localId,
    title: input.title,
    message: input.message,
    severity: input.severity ?? "info",
    source: input.source ?? "system",
    status: "unread",
    createdAt: now,
    entityLabel: input.entityLabel,
    action: input.action,
  };

  notifications = [localNotification, ...notifications];
  emitNotificationChange();
  pushToast(localNotification);

  const token = getStoredToken();
  if (!token) {
    return localNotification;
  }

  try {
    const payload: CreateNotificationPayload = {
      title: input.title,
      message: input.message,
      severity: input.severity ?? "info",
      source: input.source ?? "system",
      entityLabel: input.entityLabel,
      action: input.action,
      metadata: input.metadata,
    };

    const savedNotification = await createNotification(payload, token);
    notificationServiceReady = true;

    notifications = notifications.map((item) =>
      item.id === localId ? normalizeNotification(savedNotification) : item
    );

    emitNotificationChange();
    return savedNotification;
  } catch {
    notificationServiceReady = false;
    return localNotification;
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  emitToastChange();
}

export async function markNotificationRead(id: string) {
  const previous = notifications;

  notifications = notifications.map((item) =>
    item.id === id ? { ...item, status: "read" } : item
  );

  emitNotificationChange();

  if (id.startsWith("ntf-")) return;

  const token = getStoredToken();
  if (!token) return;

  try {
    const updated = await markNotificationAsRead(id, token);

    notifications = notifications.map((item) =>
      item.id === id ? normalizeNotification(updated) : item
    );

    emitNotificationChange();
  } catch {
    notifications = previous;
    emitNotificationChange();
  }
}

export async function markNotificationUnread(id: string) {
  const previous = notifications;

  notifications = notifications.map((item) =>
    item.id === id ? { ...item, status: "unread" } : item
  );

  emitNotificationChange();

  if (id.startsWith("ntf-")) return;

  const token = getStoredToken();
  if (!token) return;

  try {
    const updated = await markNotificationAsUnread(id, token);

    notifications = notifications.map((item) =>
      item.id === id ? normalizeNotification(updated) : item
    );

    emitNotificationChange();
  } catch {
    notifications = previous;
    emitNotificationChange();
  }
}

export async function markAllNotificationsRead() {
  const previous = notifications;

  notifications = notifications.map((item) => ({
    ...item,
    status: "read",
  }));

  emitNotificationChange();

  const token = getStoredToken();
  if (!token) return;

  try {
    await markAllNotificationsAsRead(token);
  } catch {
    notifications = previous;
    emitNotificationChange();
  }
}

export async function dismissNotification(id: string) {
  const previous = notifications;

  notifications = notifications.filter((item) => item.id !== id);
  emitNotificationChange();

  if (id.startsWith("ntf-")) return;

  const token = getStoredToken();
  if (!token) return;

  try {
    await deleteNotification(id, token);
  } catch {
    notifications = previous;
    emitNotificationChange();
  }
}

export function clearNotifications() {
  notifications = [];
  emitNotificationChange();
}

export function resetNotifications() {
  notifications = [...mockNotifications];
  emitNotificationChange();
}

export function restoreMockNotifications() {
  notifications = [...mockNotifications];
  emitNotificationChange();
}