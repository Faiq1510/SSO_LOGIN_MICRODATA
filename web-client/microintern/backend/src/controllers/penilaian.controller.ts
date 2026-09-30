import { Response, NextFunction } from "express";
import { db, withTransaction, DbClient } from "../config/database";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import {
  createPenilaian,
  findPenilaianByUserAndPengajuan,
  updatePenilaian,
  findAllEvaluationsAdmin,
  checkPesertaStatusForEvaluation,
  findPesertaSelesaiForEvaluation,
  findLatestSelesaiPengajuan,
  syncEvaluationsForInstitusi,
} from "../repositories/penilaian.repository";
import { findSertifikatByUserAndPengajuan, insertSertifikat, updateSertifikatFileUrl, findPesertaInfoForSertifikat } from "../repositories/sertifikat.repository";
import { generateSertifikat } from "../services/pdf.service";
import { getFileBuffer, getPublicFileUrl } from "../services/minio.service";
import { getSettings, incrementSertifikatCounter } from "../repositories/settings.repository";
import { sendMail } from "../utils/mail";
import { getPenilaianPklMessage, getPembaruanPenilaianPklMessage } from "../config/message";
import { getRekapPresensiByUserId } from "../repositories/presensi.repository";
import { findTemplateByInstitusi, findDefaultTemplate, findTemplateById, createTemplate, replaceKriteriaForTemplate } from "../repositories/template-penilaian.repository";
import { resolveTemplate } from "../utils/nomorGenerator";

const generateNomorSertifikat = async (): Promise<string> => {
  const [counter, settings] = await Promise.all([incrementSertifikatCounter(), getSettings()]);
  const template = settings.template_nomor_sertifikat ?? "CERT/MDI/{tahun}/{no}";
  const nomorAwal = settings.nomor_awal_sertifikat ?? 1;
  return resolveTemplate(template, counter, nomorAwal);
};

export const adminGetAllEvaluations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await findAllEvaluationsAdmin(page, limit);
    const totalPages = Math.ceil(total / limit);

    return successResponse(res, "Evaluations retrieved successfully", data, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const adminGetEvaluationByUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { userId } = req.params;

    const participant = await checkPesertaStatusForEvaluation(userId);
    if (!participant) {
      return res.status(404).json({ status: "error", message: "Participant not found" });
    }
    if (participant.status_pengajuan !== "selesai") {
      return res.status(400).json({
        status: "error",
        message: "Penilaian hanya dapat diakses/diberikan jika peserta sudah selesai magang.",
      });
    }

    const { pengajuanId } = req.query;

    let targetPengajuanId = pengajuanId as string;
    if (!targetPengajuanId) {
      const latestId = await findLatestSelesaiPengajuan(userId);
      if (latestId) targetPengajuanId = latestId;
    }

    let evaluation: any = null;
    let sertifikat_url = null;

    if (targetPengajuanId) {
      evaluation = await findPenilaianByUserAndPengajuan(userId, targetPengajuanId);
      if (evaluation) {
        const sertifikat = await findSertifikatByUserAndPengajuan(userId, targetPengajuanId);
        if (sertifikat) sertifikat_url = sertifikat.file_url;
      }
    }

    let template = await findTemplateByInstitusi(participant.institusi);
    if (!template) {
      if (evaluation) {
        template = await findTemplateById(evaluation.template_id);
      }
      if (!template) {
        template = await findDefaultTemplate();
      }
    } else if (template) {
      await syncEvaluationsForInstitusi(participant.institusi, template.id);
      if (targetPengajuanId) {
        evaluation = await findPenilaianByUserAndPengajuan(userId, targetPengajuanId);
      }
    }

    const attendanceSummary = await getRekapPresensiByUserId(userId);

    return successResponse(res, "Evaluation details retrieved successfully", {
      participant,
      evaluation: evaluation ? { ...evaluation, sertifikat_url } : null,
      template,
      attendanceSummary: attendanceSummary || {
        user_id: userId,
        nama_lengkap: participant.nama,
        institusi: participant.institusi,
        program_studi: participant.prodi,
        tanggal_masuk: "",
        tanggal_keluar: participant.tanggal_keluar,
        total_hadir: 0,
        total_izin: 0,
        total_alpha: 0,
        total_tercatat: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

const resolveTemplateAndMapItems = async (
  userId: string,
  items: { nama_kriteria: string; nilai: number }[],
  dbClient: DbClient = db
): Promise<{ templateId: string; mappedItems: { kriteria_id: string; nilai: number }[] }> => {
  const participantInfo = await checkPesertaStatusForEvaluation(userId, dbClient);
  if (!participantInfo) {
    throw new Error("Participant not found");
  }
  const institusi = participantInfo.institusi || "";
  let temp = await findTemplateByInstitusi(institusi, dbClient);
  const defaultTemp = await findDefaultTemplate(dbClient);
  if (!defaultTemp) {
    throw new Error("Default template not found");
  }
  const getNamesList = (list: any[]) => list.map((x) => x.nama_kriteria.trim().toLowerCase()).join("|");
  const incomingNames = items.map((x) => x.nama_kriteria.trim().toLowerCase()).join("|");
  let resolvedTemplateId = "";
  if (!temp) {
    const defaultNames = getNamesList(defaultTemp.kriteria || []);
    if (incomingNames === defaultNames) {
      resolvedTemplateId = defaultTemp.id;
    } else {
      const newTemp = await createTemplate(
        {
          nama_template: `Template ${institusi}`,
          institusi: institusi,
          is_default: false,
        },
        dbClient
      );
      await replaceKriteriaForTemplate(
        newTemp.id,
        items.map((x) => x.nama_kriteria.trim()),
        dbClient
      );
      resolvedTemplateId = newTemp.id;
    }
  } else {
    const existingNames = getNamesList(temp.kriteria || []);
    if (incomingNames !== existingNames) {
      await replaceKriteriaForTemplate(
        temp.id,
        items.map((x) => x.nama_kriteria.trim()),
        dbClient
      );
    }
    resolvedTemplateId = temp.id;
  }
  if (institusi && resolvedTemplateId) {
    await syncEvaluationsForInstitusi(institusi, resolvedTemplateId, dbClient);
  }
  const updatedTemplate = await findTemplateById(resolvedTemplateId, dbClient);
  if (!updatedTemplate) {
    throw new Error("Failed to load updated template");
  }
  const mappedItems = items.map((item) => {
    const match = updatedTemplate.kriteria?.find((k) => k.nama_kriteria.toLowerCase() === item.nama_kriteria.trim().toLowerCase());
    if (!match) {
      throw new Error(`Kriteria ${item.nama_kriteria} tidak ditemukan pada template.`);
    }
    return {
      kriteria_id: match.id,
      nilai: item.nilai,
    };
  });
  return {
    templateId: resolvedTemplateId,
    mappedItems,
  };
};

export const adminCreateEvaluation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { userId } = req.params;
    const { items, catatan, pengajuan_id } = req.body;
    const { pengajuanId: queryPengajuanId } = req.query;

    const checkRes = await findPesertaSelesaiForEvaluation(userId);
    if (!checkRes) {
      return res.status(404).json({ status: "error", message: "Participant not found or has no PKL application" });
    }

    if (checkRes.status !== "selesai") {
      return res.status(400).json({
        status: "error",
        message: "Admin tidak bisa memberikan nilai jika peserta belum selesai magang.",
      });
    }

    let pengajuanId = (pengajuan_id || queryPengajuanId) as string;
    if (!pengajuanId) {
      const latestId = await findLatestSelesaiPengajuan(userId);
      if (latestId) pengajuanId = latestId;
    }

    if (!pengajuanId) {
      return res.status(404).json({ status: "error", message: "Tidak ditemukan periode magang yang sudah selesai untuk dinilai." });
    }

    const existing = await findPenilaianByUserAndPengajuan(userId, pengajuanId);
    if (existing) {
      return res.status(400).json({ status: "error", message: "Evaluation already exists for this period" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: "error", message: "Kriteria penilaian (items) harus diisi." });
    }

    const criteriaNamesSet = new Set<string>();
    for (const item of items) {
      const nameKey = (item.nama_kriteria || "").trim().toLowerCase();
      if (criteriaNamesSet.has(nameKey)) {
        return res.status(400).json({ status: "error", message: "Kriteria penilaian tidak boleh memiliki nama yang sama (duplikat)." });
      }
      criteriaNamesSet.add(nameKey);
    }

    const scores = items.map((item: any) => item.nilai);
    for (const score of scores) {
      if (score === undefined || score === null || score < 0 || score > 100) {
        return res.status(400).json({ status: "error", message: "Semua nilai kriteria harus diisi dan berada dalam range 0-100" });
      }
    }

    const nomorSertifikat = await generateNomorSertifikat();
    const fullInfo = await findPesertaInfoForSertifikat(userId, pengajuanId);

    const { evaluation, file_url } = await withTransaction(async (client) => {
      const { templateId: resolvedTemplateId, mappedItems } = await resolveTemplateAndMapItems(userId, items, client);

      const nilaiAkhir = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));

      const ev = await createPenilaian(
        {
          user_id: userId,
          pengajuan_id: pengajuanId,
          dinilai_oleh: adminId,
          template_id: resolvedTemplateId,
          nilai_akhir: nilaiAkhir,
          catatan,
          items: mappedItems,
        },
        client
      );

      const certUrl = await generateSertifikat(fullInfo, ev, nomorSertifikat);

      await insertSertifikat(
        {
          user_id: userId,
          pengajuan_id: pengajuanId,
          nomor_sertifikat: nomorSertifikat,
          file_url: certUrl,
          generated_oleh: adminId,
        },
        client
      );

      return { evaluation: ev, file_url: certUrl };
    });

    const settings = await getSettings();
    if (settings.email_notification) {
      if (fullInfo && fullInfo.email) {
        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await getFileBuffer(file_url);
        } catch (e) {
          console.error("Gagal mengambil file sertifikat dari MinIO untuk lampiran email:", e);
        }
        const predikat = evaluation.nilai_akhir >= 85 ? "SANGAT BAIK" : evaluation.nilai_akhir >= 70 ? "BAIK" : "CUKUP";
        const emailMsg = getPenilaianPklMessage(
          fullInfo.nama_lengkap,
          evaluation.nilai_akhir,
          predikat,
          (evaluation.items || []).map((item: any) => ({ nama: item.nama_kriteria, nilai: item.nilai })),
          evaluation.catatan,
          getPublicFileUrl(file_url)
        );
        await sendMail({
          to: fullInfo.email,
          subject: emailMsg.subject,
          html: emailMsg.html,
          attachments: pdfBuffer
            ? [
                {
                  filename: `Sertifikat_PKL_${fullInfo.nama_lengkap.replace(/\s+/g, "_")}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : undefined,
        });
      }
    }

    return successResponse(res, "Evaluation created successfully", evaluation, 201);
  } catch (err) {
    next(err);
  }
};

export const adminUpdateEvaluation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { userId } = req.params;
    const { items, catatan, pengajuan_id } = req.body;
    const { pengajuanId: queryPengajuanId } = req.query;

    const checkRes = await findPesertaSelesaiForEvaluation(userId);
    if (!checkRes) {
      return res.status(404).json({ status: "error", message: "Participant not found or has no PKL application" });
    }

    if (checkRes.status !== "selesai") {
      return res.status(400).json({
        status: "error",
        message: "Admin tidak bisa memberikan/mengubah nilai jika peserta belum selesai magang.",
      });
    }

    let pengajuanId = (pengajuan_id || queryPengajuanId) as string;
    if (!pengajuanId) {
      const latestId = await findLatestSelesaiPengajuan(userId);
      if (latestId) pengajuanId = latestId;
    }

    if (!pengajuanId) {
      return res.status(404).json({ status: "error", message: "Tidak ditemukan periode magang yang sudah selesai." });
    }

    const existing = await findPenilaianByUserAndPengajuan(userId, pengajuanId);
    if (!existing) {
      return res.status(404).json({ status: "error", message: "Evaluation not found for this participant's latest period" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: "error", message: "Kriteria penilaian (items) harus diisi." });
    }

    const criteriaNamesSet = new Set<string>();
    for (const item of items) {
      const nameKey = (item.nama_kriteria || "").trim().toLowerCase();
      if (criteriaNamesSet.has(nameKey)) {
        return res.status(400).json({ status: "error", message: "Kriteria penilaian tidak boleh memiliki nama yang sama (duplikat)." });
      }
      criteriaNamesSet.add(nameKey);
    }

    const scores = items.map((item: any) => item.nilai);
    for (const score of scores) {
      if (score === undefined || score === null || score < 0 || score > 100) {
        return res.status(400).json({ status: "error", message: "Semua nilai kriteria harus diisi and berada dalam range 0-100" });
      }
    }

    const existingSertifikat = await findSertifikatByUserAndPengajuan(userId, pengajuanId);
    const hasExisting = !!existingSertifikat;

    const nomorSertifikat = hasExisting ? existingSertifikat.nomor_sertifikat : await generateNomorSertifikat();
    const fullInfo = await findPesertaInfoForSertifikat(userId, pengajuanId);

    const { evaluation, file_url } = await withTransaction(async (client) => {
      const { templateId: resolvedTemplateId, mappedItems } = await resolveTemplateAndMapItems(userId, items, client);

      const nilaiAkhir = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));

      const ev = await updatePenilaian(
        existing.id,
        {
          nilai_akhir: nilaiAkhir,
          catatan: catatan !== undefined ? catatan : undefined,
          template_id: resolvedTemplateId,
          items: mappedItems,
        },
        client
      );

      const certUrl = await generateSertifikat(fullInfo, ev!, nomorSertifikat);

      if (hasExisting) {
        await updateSertifikatFileUrl(userId, pengajuanId, certUrl, adminId, client);
      } else {
        await insertSertifikat(
          {
            user_id: userId,
            pengajuan_id: pengajuanId,
            nomor_sertifikat: nomorSertifikat,
            file_url: certUrl,
            generated_oleh: adminId,
          },
          client
        );
      }

      return { evaluation: ev, file_url: certUrl };
    });

    const settings = await getSettings();
    if (settings.email_notification) {
      if (fullInfo && fullInfo.email) {
        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await getFileBuffer(file_url);
        } catch (e) {
          console.error("Gagal mengambil file sertifikat dari MinIO untuk lampiran email:", e);
        }
        const predikat = evaluation!.nilai_akhir >= 85 ? "SANGAT BAIK" : evaluation!.nilai_akhir >= 70 ? "BAIK" : "CUKUP";
        const emailMsg = getPembaruanPenilaianPklMessage(
          fullInfo.nama_lengkap,
          evaluation!.nilai_akhir,
          predikat,
          (evaluation!.items || []).map((item: any) => ({ nama: item.nama_kriteria, nilai: item.nilai })),
          evaluation!.catatan,
          getPublicFileUrl(file_url)
        );
        await sendMail({
          to: fullInfo.email,
          subject: emailMsg.subject,
          html: emailMsg.html,
          attachments: pdfBuffer
            ? [
                {
                  filename: `Sertifikat_PKL_${fullInfo.nama_lengkap.replace(/\s+/g, "_")}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : undefined,
        });
      }
    }

    return successResponse(res, "Evaluation updated successfully", evaluation);
  } catch (err) {
    next(err);
  }
};

export const participantGetMyEvaluation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const userId = req.user.id;

    const checkRes = await findPesertaSelesaiForEvaluation(userId);
    if (!checkRes) {
      return res.status(400).json({
        status: "error",
        message: "Peserta belum mengajukan PKL atau status PKL tidak ditemukan.",
      });
    }

    if (checkRes.status !== "selesai") {
      return res.status(400).json({
        status: "error",
        message: "Peserta belum bisa melihat nilai jika belum selesai magang.",
      });
    }

    const { pengajuanId: queryPengajuanId } = req.query;

    let targetPengajuanId = queryPengajuanId as string;
    if (!targetPengajuanId) {
      const latestId = await findLatestSelesaiPengajuan(userId);
      if (latestId) targetPengajuanId = latestId;
    }

    let evaluation = null;
    let sertifikat_url = null;

    if (targetPengajuanId) {
      evaluation = await findPenilaianByUserAndPengajuan(userId, targetPengajuanId);
      if (evaluation) {
        const sertifikat = await findSertifikatByUserAndPengajuan(userId, targetPengajuanId);
        if (sertifikat) sertifikat_url = sertifikat.file_url;
      }
    }

    if (!evaluation) {
      return successResponse(res, "Penilaian belum diisi oleh admin.", null);
    }

    return successResponse(res, "Evaluation retrieved successfully", {
      ...evaluation,
      sertifikat_url,
    });
  } catch (err) {
    next(err);
  }
};
