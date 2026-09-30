import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { adminGetPresensiHarian } from "../controllers/presensi.controller";

const router = Router();

/**
 * @swagger
 * /admin/presensi:
 *   get:
 *     summary: Retrieve daily attendance/presence list (Admin only)
 *     tags: [Admin Presensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to retrieve attendance for (defaults to today)
 *     responses:
 *       200:
 *         description: Daily attendance list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/", authenticate, adminGetPresensiHarian);

export default router;
