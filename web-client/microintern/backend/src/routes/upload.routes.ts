import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate, AuthenticatedRequest } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { uploadFile, deleteFile } from "../services/minio.service";
import { db } from "../config/database";

const router = Router();

const checkFileOwnership = async (url: string, userId: string): Promise<boolean> => {
  const checkQueries = [
    db.query("SELECT 1 FROM profil_peserta WHERE user_id = $1 AND cv_url = $2", [userId, url]),
    db.query(
      "SELECT 1 FROM pengajuan_pkl pp JOIN kelompok k ON pp.kelompok_id = k.id JOIN kelompok_anggota ka ON ka.kelompok_id = k.id WHERE ka.user_id = $1 AND pp.surat_pengantar_url = $2",
      [userId, url]
    ),
    db.query("SELECT 1 FROM izin WHERE user_id = $1 AND bukti_url = $2", [userId, url]),
    db.query(
      "SELECT 1 FROM surat_balasan sb JOIN pengajuan_pkl pp ON sb.pengajuan_id = pp.id JOIN kelompok k ON pp.kelompok_id = k.id JOIN kelompok_anggota ka ON ka.kelompok_id = k.id WHERE ka.user_id = $1 AND sb.file_url = $2",
      [userId, url]
    ),
    db.query(
      "SELECT 1 FROM sertifikat s JOIN pengajuan_pkl pp ON s.pengajuan_id = pp.id JOIN kelompok k ON pp.kelompok_id = k.id JOIN kelompok_anggota ka ON ka.kelompok_id = k.id WHERE ka.user_id = $1 AND s.file_url = $2",
      [userId, url]
    ),
  ];

  const results = await Promise.all(checkQueries);
  return results.some((result) => result.rows.length > 0);
};

const ALLOWED_MIMETYPES = ["application/pdf", "image/jpeg", "image/png"];

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Hanya PDF, JPG, JPEG, dan PNG yang diizinkan."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a document file (CV, Surat Pengantar, Bukti Izin)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (PDF, JPG, JPEG, PNG). Max 10MB.
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                         url:
 *                           type: string
 *                           example: "cv/1719812423-123456789.pdf"
 *       400:
 *         description: Bad request (Invalid file type or size)
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
router.post("/", authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Tidak ada file yang diunggah." });
    }

    try {
      const type = (req.query.type as string) || "general";
      const folderMap: Record<string, string> = {
        cv: "cv",
        surat: "surat-pengantar",
        bukti: "bukti-izin",
        sertifikat: "sertifikat",
        general: "general",
      };
      const folder = folderMap[type] || "general";

      const url = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);

      successResponse(res, "File berhasil diunggah", { url });
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
});

/**
 * @swagger
 * /upload:
 *   delete:
 *     summary: Delete an uploaded file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: Absolute path or filename of the file to delete (must start with /uploads/)
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request (Missing or invalid URL)
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
 *       403:
 *         description: Forbidden (User does not own this file)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ status: "error", message: "URL file wajib diberikan." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized: User ID not found." });
    }

    const isOwner = await checkFileOwnership(url, userId);
    if (!isOwner) {
      return res.status(403).json({ status: "error", message: "Anda tidak memiliki izin untuk menghapus file ini." });
    }

    await deleteFile(url);
    successResponse(res, "File berhasil dihapus");
  } catch (err: any) {
    if (err.message && err.message.includes("tidak valid")) {
      return res.status(400).json({ status: "error", message: err.message });
    }
    next(err);
  }
});

export default router;
