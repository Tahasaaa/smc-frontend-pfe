import { apiRequest } from "./api";
import type {
  AppNotification,
  NotificationSeverity,
  NotificationSource,
} from "@/types/notifications";

const NOTIFICATION_API_BASE_URL = "http://127.0.0.1:8005/api";

export type CreateNotificationPayload = {
  title: string;
  message: string;
  severity?: NotificationSeverity;
  source?: NotificationSource;
  entityLabel?: string;
  action?: AppNotification["action"];
  metadata?: Record<string, unknown>;
};

export type UnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllReadResponse = {
  updatedCount: number;
  message: string;
};

export async function getNotifications(token?: string) {
  return apiRequest<AppNotification[]>("/notifications/", {
    method: "GET",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function getUnreadNotificationCount(token?: string) {
  return apiRequest<UnreadCountResponse>("/notifications/unread-count/", {
    method: "GET",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function createNotification(
  payload: CreateNotificationPayload,
  token?: string
) {
  return apiRequest<AppNotification>("/notifications/", {
    method: "POST",
    body: payload,
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function markNotificationAsRead(id: string, token?: string) {
  return apiRequest<AppNotification>(`/notifications/${id}/read/`, {
    method: "PATCH",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function markNotificationAsUnread(id: string, token?: string) {
  return apiRequest<AppNotification>(`/notifications/${id}/unread/`, {
    method: "PATCH",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function markAllNotificationsAsRead(token?: string) {
  return apiRequest<MarkAllReadResponse>("/notifications/read-all/", {
    method: "PATCH",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export async function deleteNotification(id: string, token?: string) {
  return apiRequest<void>(`/notifications/${id}/`, {
    method: "DELETE",
    token,
    baseUrl: NOTIFICATION_API_BASE_URL,
  });
}

export { NOTIFICATION_API_BASE_URL };