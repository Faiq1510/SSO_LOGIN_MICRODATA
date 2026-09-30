import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getParticipants,
  getParticipantDetail,
  getParticipantHistori,
  updateParticipant,
  getParticipantStatistics,
  getParticipantPresensi,
} from "../controllers/admin-peserta.controller";

const router = Router();

/**
 * @swagger
 * /admin/peserta:
 *   get:
 *     summary: Retrieve all participants with search and filters (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, NIM/NISN, or institution
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 *       - in: query
 *         name: institusi
 *         schema:
 *           type: string
 *         description: Filter by institution
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date range
 *     responses:
 *       200:
 *         description: List of participants retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/", authenticate, getParticipants);

/**
 * @swagger
 * /admin/peserta/statistik:
 *   get:
 *     summary: Retrieve aggregate statistics for all participants (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/statistik", authenticate, getParticipantStatistics);

/**
 * @swagger
 * /admin/peserta/{id}:
 *   get:
 *     summary: Retrieve details for a single participant (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant
 *     responses:
 *       200:
 *         description: Participant details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Participant not found
 */
router.get("/:id", authenticate, getParticipantDetail);

/**
 * @swagger
 * /admin/peserta/{id}/histori:
 *   get:
 *     summary: Retrieve details history for a single participant (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant
 *     responses:
 *       200:
 *         description: Participant history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Participant not found
 */
router.get("/:id/histori", authenticate, getParticipantHistori);

/**
 * @swagger
 * /admin/peserta/{id}:
 *   put:
 *     summary: Update participant profile data (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - nim
 *               - institusi
 *               - prodi
 *             properties:
 *               nama:
 *                 type: string
 *               nim:
 *                 type: string
 *               institusi:
 *                 type: string
 *               prodi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant updated successfully
 *       400:
 *         description: All fields are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Participant profile not found
 */
router.put("/:id", authenticate, updateParticipant);

/**
 * @swagger
 * /admin/peserta/{id}/presensi:
 *   get:
 *     summary: Retrieve details of attendance for a single participant (Admin only)
 *     tags: [Admin Peserta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the participant
 *     responses:
 *       200:
 *         description: Participant attendance details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Participant not found
 */
router.get("/:id/presensi", authenticate, getParticipantPresensi);

export default router;
