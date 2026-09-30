import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { postDatang, postPulang, getPresensiHariIni, getRiwayatPresensi } from "../controllers/presensi.controller";

const router = Router();

/**
 * @swagger
 * /presensi/datang:
 *   post:
 *     summary: Clock-in daily presence (Participant only)
 *     tags: [Presensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clock-in presence recorded successfully
 *       400:
 *         description: Bad request (Already clocked-in or not within active PKL dates)
 *       401:
 *         description: Unauthorized
 */
router.post("/datang", authenticate, postDatang);

/**
 * @swagger
 * /presensi/pulang:
 *   post:
 *     summary: Clock-out daily presence (Participant only)
 *     tags: [Presensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clock-out presence recorded successfully
 *       400:
 *         description: Bad request (Not clocked-in today, already clocked-out, or not within active PKL dates)
 *       401:
 *         description: Unauthorized
 */
router.post("/pulang", authenticate, postPulang);

/**
 * @swagger
 * /presensi/hari-ini:
 *   get:
 *     summary: Retrieve today's presence status (Participant only)
 *     tags: [Presensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's presence details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/hari-ini", authenticate, getPresensiHariIni);

/**
 * @swagger
 * /presensi/riwayat:
 *   get:
 *     summary: Retrieve attendance history (Participant only)
 *     tags: [Presensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance history list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/riwayat", authenticate, getRiwayatPresensi);

export default router;
