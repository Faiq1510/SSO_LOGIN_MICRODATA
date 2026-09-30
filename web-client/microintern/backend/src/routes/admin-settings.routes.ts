import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getWebsiteSettings, updateWebsiteSettings, getDokumenSuratBalasan, getDokumenSertifikat } from "../controllers/admin-settings.controller";

const router = Router();

/**
 * @swagger
 * /admin/website-settings:
 *   get:
 *     summary: Get website settings (Admin only)
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Website settings retrieved successfully
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
 *                         kapasitas_maksimal:
 *                           type: integer
 *                         batas_waktu_bolos:
 *                           type: string
 *                         emailNotification:
 *                           type: boolean
 *                         template_nomor_surat:
 *                           type: string
 *                           example: '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}'
 *                         template_nomor_sertifikat:
 *                           type: string
 *                           example: 'CERT/MDI/{tahun}/{no}'
 *                         nomor_awal_surat:
 *                           type: integer
 *                           minimum: 1
 *                         nomor_awal_sertifikat:
 *                           type: integer
 *                           minimum: 1
 *                         used_quota:
 *                           type: integer
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         updated_oleh:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                         active_participants:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               pengajuan_id:
 *                                 type: string
 *                                 format: uuid
 *                               tanggal_masuk:
 *                                 type: string
 *                                 format: date
 *                               tanggal_keluar:
 *                                 type: string
 *                                 format: date
 *                               jenis_kelompok:
 *                                 type: string
 *                               anggota:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     nama_lengkap:
 *                                       type: string
 *                                     email:
 *                                       type: string
 *                                     institusi:
 *                                       type: string
 *                                     program_studi:
 *                                       type: string
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
router.get("/website-settings", authenticate, getWebsiteSettings);

/**
 * @swagger
 * /admin/website-settings:
 *   put:
 *     summary: Update website settings (Admin only)
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kapasitas_maksimal:
 *                 type: integer
 *                 minimum: 1
 *               batas_waktu_bolos:
 *                 type: string
 *                 example: "23:59:00"
 *               emailNotification:
 *                 type: boolean
 *               template_nomor_surat:
 *                 type: string
 *                 example: '{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}'
 *               template_nomor_sertifikat:
 *                 type: string
 *                 example: 'CERT/MDI/{tahun}/{no}'
 *               nomor_awal_surat:
 *                 type: integer
 *                 minimum: 1
 *               nomor_awal_sertifikat:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Website settings updated successfully
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
 *                         kapasitas_maksimal:
 *                           type: integer
 *                         batas_waktu_bolos:
 *                           type: string
 *                         emailNotification:
 *                           type: boolean
 *                         template_nomor_surat:
 *                           type: string
 *                         template_nomor_sertifikat:
 *                           type: string
 *                         nomor_awal_surat:
 *                           type: integer
 *                         nomor_awal_sertifikat:
 *                           type: integer
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         updated_oleh:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Bad Request - invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put("/website-settings", authenticate, updateWebsiteSettings);

/**
 * @swagger
 * /admin/dokumen/surat-balasan:
 *   get:
 *     summary: Get list of generated response letters (Admin only)
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of response letters retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/dokumen/surat-balasan", authenticate, getDokumenSuratBalasan);

/**
 * @swagger
 * /admin/dokumen/sertifikat:
 *   get:
 *     summary: Get list of generated certificates (Admin only)
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of certificates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/dokumen/sertifikat", authenticate, getDokumenSertifikat);

export default router;
