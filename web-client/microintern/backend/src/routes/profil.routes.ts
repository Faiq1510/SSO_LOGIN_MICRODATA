import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getProfil,
  updateProfil,
  changePassword,
  connectGoogle,
  disconnectGoogle,
  getProfilPengajuan,
  requestChangeEmailOTP,
  confirmChangeEmail,
  getInstitusiSuggestions,
  getProdiSuggestions,
} from "../controllers/profil.controller";

const router = Router();

/**
 * @swagger
 * /profil/pengajuan:
 *   get:
 *     summary: Retrieve PKL application status/details for onboarding (Participant only)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active PKL application details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pendaftaran'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/pengajuan", authenticate, getProfilPengajuan);

/**
 * @swagger
 * /profil:
 *   get:
 *     summary: Get profile of logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         role:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isGoogleConnected:
 *                           type: boolean
 *                         hasPassword:
 *                           type: boolean
 *                         profile:
 *                           $ref: '#/components/schemas/ProfilPeserta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, getProfil);

/**
 * @swagger
 * /profil:
 *   put:
 *     summary: Update profile of logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               nama_lengkap:
 *                 type: string
 *               nim_nisn:
 *                 type: string
 *               institusi:
 *                 type: string
 *               program_studi:
 *                 type: string
 *               cv_url:
 *                 type: string
 *               onboarding_status:
 *                 type: string
 *                 enum: [belum_mulai, step_1_selesai, selesai]
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         role:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isGoogleConnected:
 *                           type: boolean
 *                         hasPassword:
 *                           type: boolean
 *                         profile:
 *                           $ref: '#/components/schemas/ProfilPeserta'
 *       400:
 *         description: Bad Request (Email taken or invalid input)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/", authenticate, updateProfil);

/**
 * @swagger
 * /profil/password:
 *   put:
 *     summary: Change password of logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Required for participants if they already set a password
 *               newPassword:
 *                 type: string
 *                 minimum: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (Password incorrect, or too short)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/password", authenticate, changePassword);

/**
 * @swagger
 * /profil/google/connect:
 *   post:
 *     summary: Connect Google account to the logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - currentPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (Invalid token or already connected to another user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/google/connect", authenticate, connectGoogle);

/**
 * @swagger
 * /profil/google/disconnect:
 *   delete:
 *     summary: Disconnect Google account from the logged-in user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google account disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (User doesn't have password to fall back on)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/google/disconnect", authenticate, disconnectGoogle);

/**
 * @swagger
 * /profil/email/request-otp:
 *   post:
 *     summary: Request OTP for changing email
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - currentPassword
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (Email taken, missing parameters)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/email/request-otp", authenticate, requestChangeEmailOTP);

/**
 * @swagger
 * /profil/email/confirm:
 *   put:
 *     summary: Confirm email change with OTP
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - otp
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (Invalid OTP, Email taken)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/email/confirm", authenticate, confirmChangeEmail);

/**
 * @swagger
 * /profil/suggestions/institusi:
 *   get:
 *     summary: Get institution autocomplete suggestions
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for institution name
 *     responses:
 *       200:
 *         description: Institution suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/suggestions/institusi", authenticate, getInstitusiSuggestions);

/**
 * @swagger
 * /profil/suggestions/prodi:
 *   get:
 *     summary: Get study program autocomplete suggestions
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for study program name
 *       - in: query
 *         name: institusi
 *         schema:
 *           type: string
 *         description: Institution filter
 *     responses:
 *       200:
 *         description: Study program suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/suggestions/prodi", authenticate, getProdiSuggestions);

export default router;
