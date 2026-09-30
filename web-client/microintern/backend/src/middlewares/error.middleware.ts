import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message);
  const pgErr = err as { code?: string; constraint?: string };
  if (pgErr.code === "23505" || err.message.includes("unique constraint") || err.message.includes("uq_penilaian_kriteria")) {
    if (pgErr.constraint === "uq_penilaian_kriteria" || err.message.includes("uq_penilaian_kriteria")) {
      return res.status(400).json({ status: "error", message: "Kriteria penilaian tidak boleh duplikat." });
    }
    if (pgErr.constraint === "uq_penilaian_user_pengajuan" || err.message.includes("uq_penilaian_user_pengajuan")) {
      return res.status(400).json({ status: "error", message: "Penilaian untuk periode magang ini sudah ada." });
    }
    return res.status(400).json({ status: "error", message: "Data yang dimasukkan sudah ada (duplikasi data)." });
  }
  return res.status(500).json({ status: "error", message: err.message });
};
