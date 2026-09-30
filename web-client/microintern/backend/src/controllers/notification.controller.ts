import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  findAllNotifications,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
} from "../repositories/notification.repository";
import { successResponse } from "../utils/response";

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    const list = await findAllNotifications();
    successResponse(res, "Notifikasi berhasil diambil", list);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    const count = await countUnreadNotifications();
    successResponse(res, "Jumlah notifikasi belum dibaca", { count });
  } catch (err) {
    next(err);
  }
};

export const patchMarkAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    await markNotificationAsRead(req.params.id);
    successResponse(res, "Notifikasi ditandai dibaca", null);
  } catch (err) {
    next(err);
  }
};

export const patchMarkAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    await markAllNotificationsAsRead();
    successResponse(res, "Semua notifikasi ditandai dibaca", null);
  } catch (err) {
    next(err);
  }
};

export const removeNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    const deleted = await deleteNotificationById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Notifikasi tidak ditemukan" });
    }
    successResponse(res, "Notifikasi dihapus", null);
  } catch (err) {
    next(err);
  }
};
