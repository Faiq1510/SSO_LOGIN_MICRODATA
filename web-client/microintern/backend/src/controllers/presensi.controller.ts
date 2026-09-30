import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { recordMasuk, recordKeluar, findPresensiByUserIdAndDate, findPresensiByUserId, getPresensiHarian } from "../repositories/presensi.repository";
import { findJadwalByUserId } from "../repositories/pengajuan-pkl.repository";
import { successResponse } from "../utils/response";
import { getLocalDateString, localDayjs } from "../utils/date";
import { getSettings } from "../repositories/settings.repository";

export const postDatang = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const jadwal = await findJadwalByUserId(userId);
    if (!jadwal || jadwal.status !== "aktif") {
      return res.status(400).json({
        status: "error",
        message: "Anda tidak memiliki jadwal PKL yang berjalan.",
      });
    }

    const todayStr = getLocalDateString();
    const masukStr = getLocalDateString(jadwal.tanggal_mulai);
    const keluarStr = getLocalDateString(jadwal.tanggal_selesai);

    if (todayStr < masukStr || todayStr > keluarStr) {
      return res.status(400).json({
        status: "error",
        message: `Presensi hanya dapat dilakukan selama periode PKL aktif (${masukStr} s/d ${keluarStr}).`,
      });
    }

    const settings = await getSettings();
    const limitTime = settings.batas_waktu_bolos || "23:59:00";
    const currentTime = localDayjs().format("HH:mm:ss");

    if (currentTime > limitTime) {
      return res.status(400).json({
        status: "error",
        message: `Batas waktu presensi hari ini (${limitTime.substring(0, 5)}) telah terlewati.`,
      });
    }

    const existing = await findPresensiByUserIdAndDate(userId, todayStr);
    if (existing) {
      if (existing.status === "izin") {
        return res.status(400).json({
          status: "error",
          message: "Anda sudah mengajukan izin hari ini.",
        });
      }
      if (existing.jam_masuk) {
        return res.status(400).json({
          status: "error",
          message: "Anda sudah melakukan presensi datang hari ini.",
        });
      }
    }

    const presensi = await recordMasuk(userId, todayStr, "hadir");
    successResponse(res, "Presensi datang berhasil dicatat", presensi);
  } catch (err) {
    next(err);
  }
};

export const postPulang = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const jadwal = await findJadwalByUserId(userId);
    if (!jadwal || jadwal.status !== "aktif") {
      return res.status(400).json({
        status: "error",
        message: "Anda tidak memiliki jadwal PKL yang berjalan.",
      });
    }

    const todayStr = getLocalDateString();
    const masukStr = getLocalDateString(jadwal.tanggal_mulai);
    const keluarStr = getLocalDateString(jadwal.tanggal_selesai);

    if (todayStr < masukStr || todayStr > keluarStr) {
      return res.status(400).json({
        status: "error",
        message: "Presensi hanya dapat dilakukan selama periode PKL aktif.",
      });
    }

    const existing = await findPresensiByUserIdAndDate(userId, todayStr);
    if (!existing || !existing.jam_masuk) {
      return res.status(400).json({
        status: "error",
        message: "Anda belum melakukan presensi datang hari ini.",
      });
    }

    if (existing.jam_keluar) {
      return res.status(400).json({
        status: "error",
        message: "Anda sudah melakukan presensi pulang hari ini.",
      });
    }

    const presensi = await recordKeluar(userId, todayStr);
    if (!presensi) {
      return res.status(400).json({
        status: "error",
        message: "Gagal mencatat presensi pulang.",
      });
    }

    successResponse(res, "Presensi pulang berhasil dicatat", presensi);
  } catch (err) {
    next(err);
  }
};

export const getPresensiHariIni = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const todayStr = getLocalDateString();
    const presensi = await findPresensiByUserIdAndDate(userId, todayStr);
    const settings = await getSettings();
    successResponse(res, "Status presensi hari ini retrieved", {
      presensi: presensi || null,
      batas_waktu_presensi: settings.batas_waktu_bolos || "23:59:00",
    });
  } catch (err) {
    next(err);
  }
};

export const getRiwayatPresensi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const riwayat = await findPresensiByUserId(userId);
    successResponse(res, "Riwayat presensi retrieved successfully", riwayat);
  } catch (err) {
    next(err);
  }
};

export const adminGetPresensiHarian = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { tanggal } = req.query;
    const targetTanggal = (tanggal as string) || getLocalDateString();

    const list = await getPresensiHarian(targetTanggal);
    successResponse(res, `Presensi harian tanggal ${targetTanggal} retrieved`, list);
  } catch (err) {
    next(err);
  }
};
