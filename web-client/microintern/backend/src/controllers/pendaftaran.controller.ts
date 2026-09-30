import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  findPengajuanByUserId,
  findAllPengajuanByUserId,
  findAllPengajuan,
  updatePengajuanStatus,
  checkKuota,
  findPengajuanById,
  getJadwalPublik,
  deletePengajuanById,
  deleteJadwalByPengajuanId,
  createPengajuan,
  insertJadwalPkl,
} from "../repositories/pengajuan-pkl.repository";
import { getKelompokAnggota, createKelompok, addKelompokAnggota, deleteKelompok, countKelompokAnggota } from "../repositories/kelompok.repository";
import { getSettings, incrementSuratCounter } from "../repositories/settings.repository";
import { successResponse } from "../utils/response";
import { withTransaction } from "../config/database";
import { generateSuratBalasan } from "../services/pdf.service";
import { deleteFile, getFileBuffer, getPublicFileUrl } from "../services/minio.service";
import { insertSuratBalasan, findSuratBalasanByPengajuanId, deleteSuratBalasanByPengajuanId } from "../repositories/surat-balasan.repository";
import { sendMail } from "../utils/mail";
import { getPenerimaanPklMessage, getPenolakanPklMessage } from "../config/message";
import { updateProfilByUserId } from "../repositories/profil-peserta.repository";
import { localDayjs } from "../utils/date";
import { resolveTemplate } from "../utils/nomorGenerator";

const generateNomorSurat = async (): Promise<string> => {
  const [counter, settings] = await Promise.all([incrementSuratCounter(), getSettings()]);
  const template = settings.template_nomor_surat ?? "{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}";
  const nomorAwal = settings.nomor_awal_surat ?? 1;
  return resolveTemplate(template, counter, nomorAwal);
};

export const createPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { tipePendaftaran, tanggalMasuk, tanggalKeluar, suratPengantarUrl, anggotaKelompok, nama_penerbit_surat, nomor_surat_pengantar, tanggal_surat_pengantar, perihal_surat } =
      req.body;

    if (!tanggalMasuk || !tanggalKeluar) {
      return res.status(400).json({ status: "error", message: "Tanggal masuk dan tanggal keluar wajib diisi" });
    }

    if (!suratPengantarUrl) {
      return res.status(400).json({ status: "error", message: "Surat pengantar wajib diunggah" });
    }

    if (!nama_penerbit_surat || !nomor_surat_pengantar || !tanggal_surat_pengantar || !perihal_surat) {
      return res.status(400).json({ status: "error", message: "Data surat pengantar institusi (penerbit, nomor, tanggal, perihal) wajib diisi lengkap" });
    }

    const start = localDayjs(tanggalMasuk);
    const end = localDayjs(tanggalKeluar);
    const today = localDayjs().startOf("day");

    if (end.isBefore(start) || end.isSame(start)) {
      return res.status(400).json({ status: "error", message: "Tanggal keluar harus setelah tanggal masuk" });
    }

    if (start.isBefore(today)) {
      return res.status(400).json({ status: "error", message: "Tanggal masuk tidak boleh di masa lalu" });
    }

    const existing = await findPengajuanByUserId(userId);
    if (existing) {
      if (existing.status === "aktif") {
        return res.status(400).json({ status: "error", message: "Anda masih memiliki PKL yang sedang aktif dan belum selesai." });
      }

      if (existing.status !== "selesai") {
        const oldAnggota = await getKelompokAnggota(existing.kelompok_id);

        if (existing.surat_pengantar_url && existing.surat_pengantar_url !== suratPengantarUrl) {
          try {
            await deleteFile(existing.surat_pengantar_url);
          } catch (_err) {}
        }

        for (const member of oldAnggota) {
          await updateProfilByUserId(member.user_id, { onboarding_status: "step_1_selesai" });
        }

        await deleteKelompok(existing.kelompok_id);
      }
    }

    const totalMembers = 1 + (tipePendaftaran === "Kelompok" ? anggotaKelompok?.length || 0 : 0);
    const kuotaResult = await checkKuota(tanggalMasuk, tanggalKeluar);

    if (kuotaResult.peserta_aktif + totalMembers > kuotaResult.kapasitas_maks) {
      const available = kuotaResult.kapasitas_maks - kuotaResult.peserta_aktif;
      return res.status(400).json({
        status: "error",
        message: `Kapasitas kuota PKL penuh untuk periode tersebut. Slot tersedia: ${available > 0 ? available : 0} orang.`,
      });
    }

    const returnedPengajuan = await withTransaction(async (client) => {
      const jenis = tipePendaftaran === "Kelompok" ? "kelompok" : "individu";

      const kelompok = await createKelompok({ ketua_id: userId, jenis }, client);

      await addKelompokAnggota(kelompok.id, userId, client);

      if (jenis === "kelompok" && Array.isArray(anggotaKelompok)) {
        for (const member of anggotaKelompok) {
          await addKelompokAnggota(kelompok.id, member.id, client);
        }
      }

      const pengajuan = await createPengajuan(
        {
          kelompok_id: kelompok.id,
          surat_pengantar_url: suratPengantarUrl,
          nama_penerbit_surat,
          nomor_surat_pengantar,
          tanggal_surat_pengantar,
          perihal_surat,
        },
        client
      );

      await insertJadwalPkl({ pengajuan_id: pengajuan.id, tanggal_mulai: tanggalMasuk, tanggal_selesai: tanggalKeluar }, client);

      await updateProfilByUserId(userId, { onboarding_status: "selesai" }, client);

      if (jenis === "kelompok" && Array.isArray(anggotaKelompok)) {
        for (const member of anggotaKelompok) {
          await updateProfilByUserId(member.id, { onboarding_status: "selesai" }, client);
        }
      }

      return {
        ...pengajuan,
        tanggal_masuk: tanggalMasuk,
        tanggal_keluar: tanggalKeluar,
      };
    });

    successResponse(res, "Pengajuan PKL berhasil dibuat", returnedPengajuan);
  } catch (err) {
    next(err);
  }
};

export const getPendaftaranSaya = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const pengajuan = await findPengajuanByUserId(userId);
    if (!pengajuan) {
      return successResponse(res, "Belum ada pengajuan PKL", null);
    }

    const anggota = await getKelompokAnggota(pengajuan.kelompok_id);

    const returnedPengajuan = {
      ...pengajuan,
      anggota,
      surat_balasan_url: pengajuan.surat_balasan_url ? getPublicFileUrl(pengajuan.surat_balasan_url) : null,
    };

    successResponse(res, "Pengajuan PKL retrieved successfully", returnedPengajuan);
  } catch (err) {
    next(err);
  }
};

export const getPendaftaranHistori = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const list = await findAllPengajuanByUserId(userId);
    successResponse(res, "Histori pengajuan PKL retrieved successfully", list);
  } catch (err) {
    next(err);
  }
};

export const adminGetAllPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const status = req.query.status as any;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await findAllPengajuan({
      status,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    successResponse(res, "All registrations retrieved successfully", data, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const adminTerimaPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;
    const pengajuan = await findPengajuanById(id);
    if (!pengajuan) {
      return res.status(404).json({ status: "error", message: "Pengajuan tidak ditemukan" });
    }

    const kuotaResult = await checkKuota(pengajuan.tanggal_masuk, pengajuan.tanggal_keluar, pengajuan.id);
    const countAnggota = await countKelompokAnggota(pengajuan.kelompok_id);
    const totalMembers = countAnggota || 1;

    if (kuotaResult.peserta_aktif + totalMembers > kuotaResult.kapasitas_maks) {
      const available = kuotaResult.kapasitas_maks - kuotaResult.peserta_aktif;
      return res.status(400).json({
        status: "error",
        message: `Tidak dapat menerima pengajuan. Kuota PKL penuh untuk periode tersebut. Slot tersedia: ${available > 0 ? available : 0} orang.`,
      });
    }

    const { catatan } = req.body;

    const anggota = await getKelompokAnggota(pengajuan.kelompok_id);
    const dataSurat = {
      ...pengajuan,
      anggota,
    };
    const nomorSurat = await generateNomorSurat();
    const surat_balasan_url = await generateSuratBalasan(dataSurat, "diterima", nomorSurat);

    const updated = await withTransaction(async (client) => {
      await insertSuratBalasan(
        {
          pengajuan_id: id,
          jenis: "diterima",
          nomor_surat: nomorSurat,
          file_url: surat_balasan_url,
          generated_oleh: adminId,
        },
        client
      );

      return await updatePengajuanStatus(
        id,
        {
          status: "aktif",
          diproses_oleh: adminId,
          catatan,
        },
        client
      );
    });

    const settings = await getSettings();
    if (settings.email_notification) {
      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await getFileBuffer(surat_balasan_url);
      } catch (e) {
        console.error("Gagal mengambil file PDF dari MinIO untuk lampiran email:", e);
      }

      for (const member of anggota) {
        if (member.email) {
          const formattedMulai = localDayjs(pengajuan.tanggal_masuk).toDate().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
          const formattedSelesai = localDayjs(pengajuan.tanggal_keluar).toDate().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
          const emailMsg = getPenerimaanPklMessage(member.nama_lengkap || "Peserta", formattedMulai, formattedSelesai, getPublicFileUrl(surat_balasan_url));
          await sendMail({
            to: member.email,
            subject: emailMsg.subject,
            html: emailMsg.html,
            attachments: pdfBuffer
              ? [
                  {
                    filename: `Surat_Balasan_Penerimaan_${(member.nama_lengkap || "Peserta").replace(/\s+/g, "_")}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              : undefined,
          });
        }
      }
    }

    successResponse(res, "Pengajuan PKL berhasil diterima", updated);
  } catch (err) {
    next(err);
  }
};

export const adminTolakPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;
    const { alasan_tolak } = req.body;

    if (!alasan_tolak || !alasan_tolak.trim()) {
      return res.status(400).json({ status: "error", message: "Alasan penolakan wajib diisi" });
    }

    const pengajuan = await findPengajuanById(id);
    if (!pengajuan) {
      return res.status(404).json({ status: "error", message: "Pengajuan tidak ditemukan" });
    }

    const anggota = await getKelompokAnggota(pengajuan.kelompok_id);
    const dataSurat = {
      ...pengajuan,
      status: "ditolak" as const,
      alasan_tolak,
      anggota,
    };
    const nomorSurat = await generateNomorSurat();
    const surat_balasan_url = await generateSuratBalasan(dataSurat, "ditolak", nomorSurat);

    const updated = await withTransaction(async (client) => {
      const resStatus = await updatePengajuanStatus(
        id,
        {
          status: "ditolak",
          alasan_tolak,
          diproses_oleh: adminId,
        },
        client
      );

      await insertSuratBalasan(
        {
          pengajuan_id: id,
          jenis: "ditolak",
          nomor_surat: nomorSurat,
          file_url: surat_balasan_url,
          generated_oleh: adminId,
        },
        client
      );

      return resStatus;
    });

    if (updated) {
      updated.surat_balasan_url = surat_balasan_url;
    }

    const settings = await getSettings();
    if (settings.email_notification) {
      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await getFileBuffer(surat_balasan_url);
      } catch (e) {
        console.error("Gagal mengambil file PDF dari MinIO untuk lampiran email:", e);
      }

      for (const member of anggota) {
        if (member.email) {
          const emailMsg = getPenolakanPklMessage(member.nama_lengkap || "Peserta", alasan_tolak, getPublicFileUrl(surat_balasan_url));
          await sendMail({
            to: member.email,
            subject: emailMsg.subject,
            html: emailMsg.html,
            attachments: pdfBuffer
              ? [
                  {
                    filename: `Surat_Balasan_Penolakan_${(member.nama_lengkap || "Peserta").replace(/\s+/g, "_")}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              : undefined,
          });
        }
      }
    }

    successResponse(res, "Pengajuan PKL berhasil ditolak", updated);
  } catch (err) {
    next(err);
  }
};

export const adminBatalPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;
    const pengajuan = await findPengajuanById(id);
    if (!pengajuan) {
      return res.status(404).json({ status: "error", message: "Pengajuan tidak ditemukan" });
    }

    const suratBalasan = await findSuratBalasanByPengajuanId(id);
    if (suratBalasan) {
      const fileUrl = suratBalasan.file_url;
      if (fileUrl) {
        try {
          await deleteFile(fileUrl);
        } catch (err) {}
      }
    }

    const updated = await withTransaction(async (client) => {
      if (suratBalasan) {
        await deleteSuratBalasanByPengajuanId(id, client);
      }
      await updatePengajuanStatus(
        id,
        {
          status: "menunggu",
          diproses_oleh: adminId,
        },
        client
      );

      return await findPengajuanById(id, client);
    });

    successResponse(res, "Keputusan pengajuan PKL berhasil dibatalkan", updated);
  } catch (err) {
    next(err);
  }
};

export const getJadwalPublikController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await getJadwalPublik();
    const settings = await getSettings();
    successResponse(res, "Jadwal publik retrieved successfully", {
      schedules: list,
      kapasitas_maksimal: settings.kapasitas_maksimal,
    });
  } catch (err) {
    next(err);
  }
};

export const checkKuotaController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tanggalMasuk, tanggalKeluar } = req.query;

    if (!tanggalMasuk || !tanggalKeluar) {
      return res.status(400).json({ status: "error", message: "Tanggal masuk dan tanggal keluar wajib diisi" });
    }

    const result = await checkKuota(tanggalMasuk as string, tanggalKeluar as string);
    successResponse(res, "Kuota retrieved successfully", result);
  } catch (err) {
    next(err);
  }
};

export const pesertaCancelPendaftaran = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const pengajuan = await findPengajuanByUserId(userId);
    if (!pengajuan) {
      return res.status(404).json({ status: "error", message: "Pengajuan tidak ditemukan" });
    }

    if (pengajuan.status !== "menunggu") {
      return res.status(400).json({ status: "error", message: "Hanya pengajuan dengan status menunggu yang dapat ditarik" });
    }

    await withTransaction(async (client) => {
      await deleteJadwalByPengajuanId(pengajuan.id, client);
      await deletePengajuanById(pengajuan.id, client);

      const anggota = await getKelompokAnggota(pengajuan.kelompok_id, client);
      for (const member of anggota) {
        await updateProfilByUserId(member.user_id, { onboarding_status: "step_1_selesai" }, client);
      }

      await deleteKelompok(pengajuan.kelompok_id, client);
    });

    if (pengajuan.surat_pengantar_url) {
      try {
        await deleteFile(pengajuan.surat_pengantar_url);
      } catch (err) {
        console.error("Failed to delete surat pengantar file:", err);
      }
    }

    successResponse(res, "Pengajuan pendaftaran berhasil ditarik", null);
  } catch (err) {
    next(err);
  }
};
