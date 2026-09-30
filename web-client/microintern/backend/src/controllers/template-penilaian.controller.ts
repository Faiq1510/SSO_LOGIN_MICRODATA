import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { withTransaction } from "../config/database";
import {
  findAllTemplatesWithKriteria,
  findTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  replaceKriteriaForTemplate,
} from "../repositories/template-penilaian.repository";
import { syncEvaluationsForInstitusi } from "../repositories/penilaian.repository";

export const adminGetAllTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const templates = await findAllTemplatesWithKriteria();
    return successResponse(res, "Templates retrieved successfully", templates);
  } catch (err) {
    next(err);
  }
};

export const adminGetTemplateById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const { id } = req.params;
    const template = await findTemplateById(id);
    if (!template) {
      return res.status(404).json({ status: "error", message: "Template not found" });
    }
    return successResponse(res, "Template retrieved successfully", template);
  } catch (err) {
    next(err);
  }
};

export const adminCreateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const { nama_template, institusi, kriteria } = req.body;
    if (!nama_template) {
      return res.status(400).json({ status: "error", message: "nama_template is required" });
    }
    if (!Array.isArray(kriteria) || kriteria.length === 0) {
      return res.status(400).json({ status: "error", message: "kriteria array is required and cannot be empty" });
    }

    const fullTemplate = await withTransaction(async (client) => {
      const template = await createTemplate({ nama_template, institusi }, client);
      await replaceKriteriaForTemplate(template.id, kriteria, client);
      const created = await findTemplateById(template.id, client);
      if (created && created.institusi) {
        await syncEvaluationsForInstitusi(created.institusi, created.id, client);
      }
      return created;
    });

    return successResponse(res, "Template created successfully", fullTemplate, 201);
  } catch (err) {
    next(err);
  }
};

export const adminUpdateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const { id } = req.params;
    const { nama_template, institusi, kriteria } = req.body;

    const existing = await findTemplateById(id);
    if (!existing) {
      return res.status(404).json({ status: "error", message: "Template not found" });
    }

    if (Array.isArray(kriteria) && kriteria.length === 0) {
      return res.status(400).json({ status: "error", message: "kriteria array cannot be empty" });
    }

    const fullTemplate = await withTransaction(async (client) => {
      await updateTemplate(id, { nama_template, institusi }, client);

      if (Array.isArray(kriteria)) {
        await replaceKriteriaForTemplate(id, kriteria, client);
      }

      const updated = await findTemplateById(id, client);
      if (updated && updated.institusi) {
        await syncEvaluationsForInstitusi(updated.institusi, updated.id, client);
      }
      return updated;
    });

    return successResponse(res, "Template updated successfully", fullTemplate);
  } catch (err) {
    next(err);
  }
};

export const adminDeleteTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const { id } = req.params;

    const existing = await findTemplateById(id);
    if (!existing) {
      return res.status(404).json({ status: "error", message: "Template not found" });
    }
    if (existing.is_default) {
      return res.status(400).json({ status: "error", message: "Cannot delete the default template" });
    }

    const deleted = await deleteTemplate(id);
    if (!deleted) {
      return res.status(400).json({ status: "error", message: "Failed to delete template" });
    }

    return successResponse(res, "Template deleted successfully", null);
  } catch (err) {
    next(err);
  }
};
