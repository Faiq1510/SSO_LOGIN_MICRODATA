import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { createIzin, findAllIzin, deleteIzinByUserAndDate, findIzinByUserId, findIzinById, deleteIzinById as deleteIzinRepo } from "../repositories/izin.repository";
import { recordMasuk, deletePresensiByUserAndDate } from "../repositories/presensi.repository";
import { findJadwalByUserId } from "../repositories/pengajuan-pkl.repository";
import { findProfilByUserId } from "../repositories/profil-peserta.repository";
import { createNotification } from "../repositories/notification.repository";
import { successResponse } from "../utils/response";
import { getLocalDateString, localDayjs } from "../utils/date";
import { withTransaction } from "../config/database";

export const postIzin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { tanggalMulai, tanggalSelesai, kategori, alasan, buktiUrl } = req.body;

    if (!tanggalMulai || !tanggalSelesai || !kategori || !alasan) {
      return res.status(400).json({ status: "error", message: "Tanggal mulai, tanggal selesai, kategori, dan alasan wajib diisi" });
    }

    const validKategori = ["Izin Sakit", "Izin Kegiatan", "Izin WFH"];
    if (!validKategori.includes(kategori)) {
      return res.status(400).json({ status: "error", message: "Kategori izin tidak valid" });
    }

    const start = localDayjs(tanggalMulai);
    const end = localDayjs(tanggalSelesai);

    if (end.isBefore(start)) {
      return res.status(400).json({ status: "error", message: "Tanggal selesai harus sama atau setelah tanggal mulai" });
    }

    const jadwal = await findJadwalByUserId(userId);
    if (!jadwal) {
      return res.status(400).json({ status: "error", message: "Anda belum memiliki jadwal PKL aktif." });
    }

    if (jadwal.status !== "aktif") {
      return res.status(400).json({ status: "error", message: "Izin hanya dapat diajukan jika PKL berstatus aktif." });
    }

    const pMasuk = localDayjs(jadwal.tanggal_mulai);
    const pKeluar = localDayjs(jadwal.tanggal_selesai);

    if (start.isBefore(pMasuk, "day") || end.isAfter(pKeluar, "day")) {
      const pMasukStr = pMasuk.format("YYYY-MM-DD");
      const pKeluarStr = pKeluar.format("YYYY-MM-DD");
      return res.status(400).json({
        status: "error",
        message: `Tanggal pengajuan izin harus berada dalam periode PKL aktif (${pMasukStr} s/d ${pKeluarStr}).`,
      });
    }

    const dates: string[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dayOfWeek = current.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(current.format("YYYY-MM-DD"));
      }
      current = current.add(1, "day");
    }

    await withTransaction(async (client) => {
      for (const dateStr of dates) {
        await deleteIzinByUserAndDate(userId, dateStr, client);

        await createIzin(
          {
            user_id: userId,
            tanggal: dateStr,
            kategori,
            alasan,
            bukti_url: buktiUrl || null,
          },
          client
        );

        await deletePresensiByUserAndDate(userId, dateStr, client);
        await recordMasuk(userId, dateStr, "izin", client);
      }
    });

    const profil = await findProfilByUserId(userId);
    const namaDisplay = profil?.nama_lengkap ?? "Peserta";
    const rangeText = tanggalMulai === tanggalSelesai ? tanggalMulai : `${tanggalMulai} s/d ${tanggalSelesai}`;

    await createNotification({
      type: "izin",
      title: "Pengajuan Izin Baru",
      body: `${namaDisplay} mengajukan izin (${kategori}) untuk ${rangeText}.`,
      related_id: null,
      target_date: tanggalMulai,
    });

    successResponse(res, "Pengajuan izin berhasil dicatat", null);
  } catch (err) {
    next(err);
  }
};

export const adminGetAllIzin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { tanggal, nama_peserta } = req.query;

    const list = await findAllIzin({
      tanggal: tanggal ? (tanggal as string) : undefined,
      nama_peserta: nama_peserta ? (nama_peserta as string) : undefined,
    });

    successResponse(res, "Daftar pengajuan izin berhasil diambil", list);
  } catch (err) {
    next(err);
  }
};

export const getIzinSaya = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const list = await findIzinByUserId(userId);
    successResponse(res, "Data pengajuan izin berhasil diambil", list);
  } catch (err) {
    next(err);
  }
};

export const deleteIzinById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const izin = await findIzinById(id);
    if (!izin) {
      return res.status(404).json({ status: "error", message: "Data izin tidak ditemukan" });
    }

    if (izin.user_id !== userId) {
      return res.status(403).json({ status: "error", message: "Forbidden: Not your data" });
    }

    const izinDate = getLocalDateString(izin.tanggal);
    const today = getLocalDateString();

    if (izinDate < today) {
      return res.status(400).json({ status: "error", message: "Tidak dapat membatalkan izin untuk hari yang sudah lewat." });
    }

    await withTransaction(async (client) => {
      await deletePresensiByUserAndDate(userId, izinDate, client);
      await deleteIzinRepo(id, client);
    });

    successResponse(res, "Pengajuan izin berhasil dibatalkan", null);
  } catch (err) {
    next(err);
  }
};
