import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getLaporanExport } from "../controllers/admin-laporan.controller";

const router = Router();

/**
 * @swagger
 * /admin/laporan/export:
 *   get:
 *     summary: Export reports as CSV, XLSX, or PDF (Admin only)
 *     tags: [Admin Laporan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [peserta, presensi, nilai]
 *         description: Type of report to export
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, pdf]
 *           default: csv
 *         description: Output format (csv, xlsx, or pdf)
 *     responses:
 *       200:
 *         description: Report file streamed as download
 *       400:
 *         description: Invalid export type or format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/export", authenticate, getLaporanExport);

export default router;
