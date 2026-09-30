import { Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { withTransaction } from "../config/database";
import { successResponse } from "../utils/response";
import {
  findParticipants,
  findParticipantDetail,
  findParticipantAttendanceStats,
  checkEmailExistsOtherThanUser,
  updateUserEmailAndPassword,
  updateProfilPeserta,
  findParticipantHistori,
  getParticipantStats,
  findPresensiByUserIdAdmin,
} from "../repositories/admin-peserta.repository";

export const getParticipants = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const search = req.query.search as string;
    const status = req.query.status as string;
    const institusi = req.query.institusi as string;
    const prodi = req.query.prodi as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await findParticipants({
      search,
      status,
      institusi,
      prodi,
      startDate,
      endDate,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    successResponse(res, "Participants retrieved successfully", data, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const getParticipantDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;

    const participant = await findParticipantDetail(id);
    if (!participant) {
      return res.status(404).json({ status: "error", message: "Participant not found" });
    }

    const stats = await findParticipantAttendanceStats(id);

    successResponse(res, "Participant retrieved successfully", {
      ...participant,
      attendance: stats,
    });
  } catch (err) {
    next(err);
  }
};

export const updateParticipant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;
    const { nama, nim, institusi, prodi, email, password } = req.body;

    if (!nama || !nim || !institusi || !prodi || !email) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }

    const emailExists = await checkEmailExistsOtherThanUser(email, id);
    if (emailExists) {
      return res.status(400).json({ status: "error", message: "Email is already in use by another user" });
    }

    const updatedProfile = await withTransaction(async (client) => {
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await updateUserEmailAndPassword(id, email, passwordHash, client);
      } else {
        await updateUserEmailAndPassword(id, email, undefined, client);
      }

      const profile = await updateProfilPeserta(id, { nama, nim, institusi, prodi }, client);

      if (!profile) {
        throw new Error("Participant profile not found");
      }
      return profile;
    });

    successResponse(res, "Participant updated successfully", updatedProfile);
  } catch (err) {
    next(err);
  }
};

export const getParticipantHistori = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const { id } = req.params;

    const result = await findParticipantHistori(id);

    successResponse(res, "Histori retrieved successfully", result);
  } catch (err) {
    next(err);
  }
};

export const getParticipantStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const stats = await getParticipantStats();
    successResponse(res, "Statistics retrieved successfully", stats);
  } catch (err) {
    next(err);
  }
};

export const getParticipantPresensi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }
    const { id } = req.params;
    const data = await findPresensiByUserIdAdmin(id);
    successResponse(res, "Presensi retrieved successfully", data);
  } catch (err) {
    next(err);
  }
};
