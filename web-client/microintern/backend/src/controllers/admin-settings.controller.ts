import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getSettings, updateSettings, getActiveQuotaCount, getSettingsUpdater, getActiveParticipants } from "../repositories/settings.repository";
import { findAllSuratBalasan } from "../repositories/surat-balasan.repository";
import { findAllSertifikat } from "../repositories/sertifikat.repository";
import { successResponse } from "../utils/response";

export const getWebsiteSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const settings = await getSettings();

    const usedQuota = await getActiveQuotaCount();
    const updater = await getSettingsUpdater(settings.updated_oleh);
    const activeParticipants = await getActiveParticipants();

    successResponse(res, "Website settings retrieved successfully", {
      kapasitas_maksimal: settings.kapasitas_maksimal,
      batas_waktu_bolos: settings.batas_waktu_bolos,
      emailNotification: settings.email_notification,
      template_nomor_surat: settings.template_nomor_surat ?? "{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}",
      template_nomor_sertifikat: settings.template_nomor_sertifikat ?? "CERT/MDI/{tahun}/{no}",
      nomor_awal_surat: settings.nomor_awal_surat ?? 1,
      nomor_awal_sertifikat: settings.nomor_awal_sertifikat ?? 1,
      counter_surat: settings.counter_surat ?? 0,
      counter_sertifikat: settings.counter_sertifikat ?? 0,
      used_quota: usedQuota,
      updated_at: settings.updated_at,
      updated_oleh: updater
        ? {
            name: updater.name || "Admin HRD",
            email: updater.email,
          }
        : null,
      active_participants: activeParticipants,
    });
  } catch (err) {
    next(err);
  }
};

export const updateWebsiteSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { kapasitas_maksimal, batas_waktu_bolos, emailNotification, template_nomor_surat, template_nomor_sertifikat, nomor_awal_surat, nomor_awal_sertifikat } = req.body;

    if (kapasitas_maksimal !== undefined) {
      if (typeof kapasitas_maksimal !== "number" || kapasitas_maksimal <= 0) {
        return res.status(400).json({ status: "error", message: "Kapasitas maksimal harus berupa angka positif" });
      }
    }

    if (batas_waktu_bolos && !/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(batas_waktu_bolos)) {
      return res.status(400).json({ status: "error", message: "Format batas waktu bolos tidak valid (HH:MM / HH:MM:SS)" });
    }

    if (template_nomor_surat !== undefined && !template_nomor_surat.includes("{no}")) {
      return res.status(400).json({ status: "error", message: "Template nomor surat harus mengandung placeholder {no}" });
    }

    if (template_nomor_sertifikat !== undefined && !template_nomor_sertifikat.includes("{no}")) {
      return res.status(400).json({ status: "error", message: "Template nomor sertifikat harus mengandung placeholder {no}" });
    }

    if (nomor_awal_surat !== undefined && (typeof nomor_awal_surat !== "number" || nomor_awal_surat < 1)) {
      return res.status(400).json({ status: "error", message: "Nomor awal surat harus berupa angka positif (minimal 1)" });
    }

    if (nomor_awal_sertifikat !== undefined && (typeof nomor_awal_sertifikat !== "number" || nomor_awal_sertifikat < 1)) {
      return res.status(400).json({ status: "error", message: "Nomor awal sertifikat harus berupa angka positif (minimal 1)" });
    }

    const updates: any = { updated_oleh: userId };
    if (kapasitas_maksimal !== undefined) updates.kapasitas_maksimal = kapasitas_maksimal;
    if (batas_waktu_bolos !== undefined) updates.batas_waktu_bolos = batas_waktu_bolos;
    if (emailNotification !== undefined) updates.email_notification = !!emailNotification;
    if (template_nomor_surat !== undefined) updates.template_nomor_surat = template_nomor_surat;
    if (template_nomor_sertifikat !== undefined) updates.template_nomor_sertifikat = template_nomor_sertifikat;
    if (nomor_awal_surat !== undefined) updates.nomor_awal_surat = nomor_awal_surat;
    if (nomor_awal_sertifikat !== undefined) updates.nomor_awal_sertifikat = nomor_awal_sertifikat;

    const updated = await updateSettings(updates);

    successResponse(res, "Website settings updated successfully", {
      kapasitas_maksimal: updated.kapasitas_maksimal,
      batas_waktu_bolos: updated.batas_waktu_bolos,
      emailNotification: updated.email_notification,
      template_nomor_surat: updated.template_nomor_surat ?? "{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}",
      template_nomor_sertifikat: updated.template_nomor_sertifikat ?? "CERT/MDI/{tahun}/{no}",
      nomor_awal_surat: updated.nomor_awal_surat ?? 1,
      nomor_awal_sertifikat: updated.nomor_awal_sertifikat ?? 1,
      updated_at: updated.updated_at,
      updated_oleh: userId,
    });
  } catch (err) {
    next(err);
  }
};

export const getDokumenSuratBalasan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const result = await findAllSuratBalasan(page, limit);
    successResponse(res, "Daftar surat balasan berhasil diambil", {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getDokumenSertifikat = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const result = await findAllSertifikat(page, limit);
    successResponse(res, "Daftar sertifikat berhasil diambil", {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (err) {
    next(err);
  }
};
