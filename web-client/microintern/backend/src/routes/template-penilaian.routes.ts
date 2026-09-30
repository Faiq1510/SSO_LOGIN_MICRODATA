import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { adminGetAllTemplates, adminGetTemplateById, adminCreateTemplate, adminUpdateTemplate, adminDeleteTemplate } from "../controllers/template-penilaian.controller";

const router = Router();

/**
 * @swagger
 * /admin/template-penilaian:
 *   get:
 *     summary: Retrieve all evaluation templates (Admin only)
 *     tags: [Admin Template Penilaian]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of evaluation templates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.get("/admin/template-penilaian", authenticate, adminGetAllTemplates);

/**
 * @swagger
 * /admin/template-penilaian/{id}:
 *   get:
 *     summary: Retrieve details of a specific evaluation template (Admin only)
 *     tags: [Admin Template Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The template ID
 *     responses:
 *       200:
 *         description: Template details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Template not found
 */
router.get("/admin/template-penilaian/:id", authenticate, adminGetTemplateById);

/**
 * @swagger
 * /admin/template-penilaian:
 *   post:
 *     summary: Create a new evaluation template (Admin only)
 *     tags: [Admin Template Penilaian]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_template
 *               - kriteria
 *             properties:
 *               nama_template:
 *                 type: string
 *               institusi:
 *                 type: string
 *               kriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 */
router.post("/admin/template-penilaian", authenticate, adminCreateTemplate);

/**
 * @swagger
 * /admin/template-penilaian/{id}:
 *   put:
 *     summary: Update an evaluation template (Admin only)
 *     tags: [Admin Template Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_template:
 *                 type: string
 *               institusi:
 *                 type: string
 *               kriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Template not found
 */
router.put("/admin/template-penilaian/:id", authenticate, adminUpdateTemplate);

/**
 * @swagger
 * /admin/template-penilaian/{id}:
 *   delete:
 *     summary: Delete an evaluation template (Admin only)
 *     tags: [Admin Template Penilaian]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access only
 *       404:
 *         description: Template not found
 */
router.delete("/admin/template-penilaian/:id", authenticate, adminDeleteTemplate);

export default router;
