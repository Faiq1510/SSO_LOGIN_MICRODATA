import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getDashboardAdmin } from "../repositories/dashboard-admin.repository";
import { findAllPengajuan } from "../repositories/pengajuan-pkl.repository";
import { successResponse } from "../utils/response";

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const stats = await getDashboardAdmin();
    const { data: recentRegistrations } = await findAllPengajuan({ limit: 5 });

    successResponse(res, "Dashboard data retrieved successfully", {
      stats,
      recentRegistrations,
    });
  } catch (err) {
    next(err);
  }
};
