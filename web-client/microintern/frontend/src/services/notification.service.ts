import { apiRequest } from "../utils/api";

export const getAdminNotifications = () => apiRequest("/admin/notifications");

export const getAdminUnreadCount = () => apiRequest("/admin/notifications/count");

export const markNotificationRead = (id: string) => apiRequest(`/admin/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () => apiRequest("/admin/notifications/read-all", { method: "PATCH" });

export const deleteAdminNotification = (id: string) => apiRequest(`/admin/notifications/${id}`, { method: "DELETE" });
