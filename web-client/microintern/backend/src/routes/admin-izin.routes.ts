import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { adminGetAllIzin } from "../controllers/izin.controller";

const router = Router();

/**
 * @swagger
 * /admin/izin:
 *   get:
 *     summary: Retrieve all leave/permission requests (Admin only)
 *     tags: [Admin Izin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: nama_peserta
 *         schema:
 *           type: string
 *         description: Filter by participant name
 *     responses:
 *       200:
 *         description: List of leave/permission requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/", authenticate, adminGetAllIzin);

export default router;
