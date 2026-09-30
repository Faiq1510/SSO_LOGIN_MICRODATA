import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { postIzin, getIzinSaya, deleteIzinById } from "../controllers/izin.controller";

const router = Router();

/**
 * @swagger
 * /izin:
 *   post:
 *     summary: Submit a leave/permission request (Participant only)
 *     tags: [Izin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tanggalMulai
 *               - tanggalSelesai
 *               - alasan
 *             properties:
 *               tanggalMulai:
 *                 type: string
 *                 format: date
 *                 description: Start date (YYYY-MM-DD)
 *               tanggalSelesai:
 *                 type: string
 *                 format: date
 *                 description: End date (YYYY-MM-DD)
 *               alasan:
 *                 type: string
 *                 description: Reason for leave
 *               buktiUrl:
 *                 type: string
 *                 description: URL to supporting document/proof
 *     responses:
 *       200:
 *         description: Leave/permission request recorded successfully
 *       400:
 *         description: Bad request (Invalid date range or missing fields)
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, postIzin);

/**
 * @swagger
 * /izin/saya:
 *   get:
 *     summary: Get all leave/permission requests for the current user
 *     tags: [Izin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leave requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/saya", authenticate, getIzinSaya);

/**
 * @swagger
 * /izin/{id}:
 *   delete:
 *     summary: Cancel/delete a leave/permission request (Participant only)
 *     tags: [Izin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Leave request cancelled successfully
 *       400:
 *         description: Cannot cancel past leave requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not your data)
 *       404:
 *         description: Leave request not found
 *
 */
router.delete("/:id", authenticate, deleteIzinById);

export default router;
