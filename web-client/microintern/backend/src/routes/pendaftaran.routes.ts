import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createPendaftaran,
  getPendaftaranSaya,
  getPendaftaranHistori,
  adminGetAllPendaftaran,
  adminTerimaPendaftaran,
  adminTolakPendaftaran,
  adminBatalPendaftaran,
  getJadwalPublikController,
  checkKuotaController,
  pesertaCancelPendaftaran,
} from "../controllers/pendaftaran.controller";

const router = Router();

/**
 * @swagger
 * /pendaftaran/jadwal-publik:
 *   get:
 *     summary: Retrieve public PKL schedule/quota status
 *     tags: [Pendaftaran]
 *     security: []
 *     responses:
 *       200:
 *         description: Public schedule retrieved successfully
 */
router.get("/jadwal-publik", getJadwalPublikController);

/**
 * @swagger
 * /pendaftaran/cek-kuota:
 *   get:
 *     summary: Check quota availability for date range (Participant only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggalMasuk
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tanggalKeluar
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Quota status retrieved successfully
 */
router.get("/cek-kuota", authenticate, checkKuotaController);

/**
 * @swagger
 * /pendaftaran:
 *   post:
 *     summary: Submit PKL application (Participant only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipePendaftaran
 *               - tanggalMasuk
 *               - tanggalKeluar
 *               - suratPengantarUrl
 *             properties:
 *               tipePendaftaran:
 *                 type: string
 *                 enum: [Individu, Kelompok]
 *               tanggalMasuk:
 *                 type: string
 *                 format: date
 *               tanggalKeluar:
 *                 type: string
 *                 format: date
 *               suratPengantarUrl:
 *                 type: string
 *               anggotaKelompok:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: PKL application submitted successfully
 *       400:
 *         description: Bad request (Validation error or quota full)
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate, createPendaftaran);

/**
 * @swagger
 * /pendaftaran/histori:
 *   get:
 *     summary: Retrieve user's PKL history (Participant only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/histori", authenticate, getPendaftaranHistori);

/**
 * @swagger
 * /pendaftaran/saya:
 *   get:
 *     summary: Retrieve user's own PKL application details and status (Participant only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own registration details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/saya", authenticate, getPendaftaranSaya);

/**
 * @swagger
 * /pendaftaran/admin:
 *   get:
 *     summary: Retrieve all PKL applications (Admin only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [menunggu, aktif, selesai, ditolak]
 *         description: Filter by application status
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/admin", authenticate, adminGetAllPendaftaran);

/**
 * @swagger
 * /pendaftaran/admin/{id}/terima:
 *   put:
 *     summary: Accept a PKL application (Admin only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application accepted successfully
 *       400:
 *         description: Quota capacity full
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Application not found
 */
router.put("/admin/:id/terima", authenticate, adminTerimaPendaftaran);

/**
 * @swagger
 * /pendaftaran/admin/{id}/tolak:
 *   put:
 *     summary: Reject a PKL application (Admin only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alasan_tolak
 *             properties:
 *               alasan_tolak:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *       400:
 *         description: Reason is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Application not found
 */
router.put("/admin/:id/tolak", authenticate, adminTolakPendaftaran);

/**
 * @swagger
 * /pendaftaran/admin/{id}/batal:
 *   put:
 *     summary: Cancel/revert a PKL application decision back to waiting (Admin only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Decision reverted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Application not found
 */
router.put("/admin/:id/batal", authenticate, adminBatalPendaftaran);

/**
 * @swagger
 * /pendaftaran/saya:
 *   delete:
 *     summary: Cancel/withdraw a pending PKL application (Participant only)
 *     tags: [Pendaftaran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
 *       400:
 *         description: Only pending applications can be withdrawn
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 *
 */
router.delete("/saya", authenticate, pesertaCancelPendaftaran);

export default router;
