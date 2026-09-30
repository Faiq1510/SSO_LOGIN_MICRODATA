import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { adminGetAllEvaluations, adminGetEvaluationByUser, adminCreateEvaluation, adminUpdateEvaluation, participantGetMyEvaluation } from "../controllers/penilaian.controller";

const router = Router();

/**
 * @swagger
 * /admin/penilaian:
 *   get:
 *     summary: Retrieve all participants who completed PKL with evaluation status (Admin only)
 *     tags: [Admin Penilaian]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of participants and their evaluation details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/admin/penilaian", authenticate, adminGetAllEvaluations);

/**
 * @swagger
 * /admin/penilaian/{userId}:
 *   get:
 *     summary: Retrieve evaluation details for a specific participant (Admin only)
 *     tags: [Admin Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID of the participant
 *     responses:
 *       200:
 *         description: Participant detail and evaluation object
 *       400:
 *         description: Participant not completed yet
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Participant not found
 */
router.get("/admin/penilaian/:userId", authenticate, adminGetEvaluationByUser);

/**
 * @swagger
 * /admin/penilaian/{userId}:
 *   post:
 *     summary: Create evaluation/grades for a participant (Admin only)
 *     tags: [Admin Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID of the participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disiplin
 *               - kehadiran
 *               - komunikasi
 *               - kerja_sama
 *               - tanggung_jawab
 *               - inisiatif
 *             properties:
 *               disiplin:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               kehadiran:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               komunikasi:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               kerja_sama:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               tanggung_jawab:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               inisiatif:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               catatan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evaluation created successfully
 *       400:
 *         description: Bad request (Invalid score, participant not completed, or evaluation exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.post("/admin/penilaian/:userId", authenticate, adminCreateEvaluation);

/**
 * @swagger
 * /admin/penilaian/{userId}:
 *   put:
 *     summary: Update evaluation/grades for a participant (Admin only)
 *     tags: [Admin Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID of the participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disiplin:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               kehadiran:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               komunikasi:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               kerja_sama:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               tanggung_jawab:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               inisiatif:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evaluation updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.put("/admin/penilaian/:userId", authenticate, adminUpdateEvaluation);

/**
 * @swagger
 * /penilaian/saya:
 *   get:
 *     summary: Retrieve my own evaluation details (Participant only)
 *     tags: [Penilaian]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Evaluation object or null if not yet graded
 *       400:
 *         description: Participant not completed yet or no application
 *       401:
 *         description: Unauthorized
 */
router.get("/penilaian/saya", authenticate, participantGetMyEvaluation);

export default router;
