import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getAdminDashboard } from "../controllers/dashboard-admin.controller";

const router = Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data (stats & recent registrations)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stats:
 *                           type: object
 *                           properties:
 *                             total_menunggu:
 *                               type: integer
 *                             total_aktif:
 *                               type: integer
 *                             total_selesai:
 *                               type: integer
 *                             total_ditolak:
 *                               type: integer
 *                             total_semua:
 *                               type: integer
 *                         recentRegistrations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Pendaftaran'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/dashboard", authenticate, getAdminDashboard);

export default router;
