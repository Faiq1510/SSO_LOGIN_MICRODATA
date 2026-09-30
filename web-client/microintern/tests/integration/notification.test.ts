import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNotifications, getUnreadCount, patchMarkAsRead, patchMarkAllAsRead, removeNotification } from "@backend/controllers/notification.controller";
import * as notificationRepo from "@backend/repositories/notification.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/notification.repository");

describe("Notification Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 403 for non-admin user", async () => {
    const req = createMockReq({ user: { id: "u1", role: "peserta" } });
    const res = createMockRes();
    const next = createMockNext();

    await getNotifications(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return notifications list for admin", async () => {
    const req = createMockReq({ user: { id: "a1", role: "admin" } });
    const res = createMockRes();
    const next = createMockNext();

    const mockNotifs = [{ id: "n1", title: "Pendaftaran Baru", is_read: false }];
    vi.mocked(notificationRepo.findAllNotifications).mockResolvedValue(mockNotifs as any);

    await getNotifications(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: mockNotifs,
      })
    );
  });

  it("should return unread count", async () => {
    const req = createMockReq({ user: { id: "a1", role: "admin" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(notificationRepo.countUnreadNotifications).mockResolvedValue(3);

    await getUnreadCount(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: { count: 3 },
      })
    );
  });

  it("should mark single notification as read", async () => {
    const req = createMockReq({ user: { id: "a1", role: "admin" }, params: { id: "n1" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(notificationRepo.markNotificationAsRead).mockResolvedValue(undefined as any);

    await patchMarkAsRead(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Notifikasi ditandai dibaca",
      })
    );
  });

  it("should mark all notifications as read", async () => {
    const req = createMockReq({ user: { id: "a1", role: "admin" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(notificationRepo.markAllNotificationsAsRead).mockResolvedValue(undefined as any);

    await patchMarkAllAsRead(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Semua notifikasi ditandai dibaca",
      })
    );
  });

  it("should delete notification", async () => {
    const req = createMockReq({ user: { id: "a1", role: "admin" }, params: { id: "n1" } });
    const res = createMockRes();
    const next = createMockNext();

    vi.mocked(notificationRepo.deleteNotificationById).mockResolvedValue(true);

    await removeNotification(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Notifikasi dihapus",
      })
    );
  });
});
