import { Response, NextFunction } from "express";
import { withTransaction } from "../config/database";
import bcrypt from "bcrypt";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { findProfilByUserId, updateProfilByUserId, insertProfil, findInstitusiSuggestions, findProdiSuggestions } from "../repositories/profil-peserta.repository";
import { findUserByEmail, modifyUser, findUserByIdWithPassword, findUserByGoogleId } from "../repositories/user.repository";
import { verifyGoogleIdToken } from "../utils/googleAuth";
import { successResponse } from "../utils/response";
import { findPengajuanByUserId } from "../repositories/pengajuan-pkl.repository";
import { sendMail } from "../utils/mail";
import { getKonfirmasiPerubahanEmailMessage } from "../config/message";
import { generateOtp } from "../utils/otp";
import { insertOtp, findOtp, deleteOtp } from "../repositories/pending-otp.repository";
import { localDayjs } from "../utils/date";

export const getProfil = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const user = await findUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const profil = await findProfilByUserId(userId);

    successResponse(res, "Profile retrieved successfully", {
      id: user.id,
      email: user.email,
      role: user.role,
      name: profil?.nama_lengkap || user.name || (user.role === "admin" ? "Admin HRD" : "Peserta"),
      isGoogleConnected: !!user.google_id,
      hasPassword: !!user.password_hash,
      emailVerified: user.email_verified,
      profile: profil
        ? {
            nama_lengkap: profil.nama_lengkap,
            jenjang_pendidikan: profil.jenjang_pendidikan,
            nim_nisn: profil.nim_nisn,
            institusi: profil.institusi,
            program_studi: profil.program_studi,
            cv_url: profil.cv_url,
            onboarding_status: profil.onboarding_status,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfil = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { email, nama_lengkap, jenjang_pendidikan, nim_nisn, institusi, program_studi, cv_url, onboarding_status } = req.body;

    if (email && email !== req.user?.email) {
      // NOTE: Direct email change removed. Participants must use OTP endpoint.
      // We ignore email changes from this endpoint.
    }

    let profil = await findProfilByUserId(userId);
    if (profil) {
      profil = await updateProfilByUserId(userId, {
        nama_lengkap,
        jenjang_pendidikan,
        nim_nisn: nim_nisn || "-",
        institusi: institusi || "-",
        program_studi: program_studi || "-",
        cv_url: cv_url !== undefined ? cv_url : profil.cv_url,
        onboarding_status: onboarding_status || (profil.onboarding_status === "belum_mulai" ? "step_1_selesai" : profil.onboarding_status),
      });
    } else {
      profil = await insertProfil({
        user_id: userId,
        nama_lengkap: nama_lengkap || (req.user?.role === "admin" ? "Admin HRD" : "Peserta"),
        jenjang_pendidikan: jenjang_pendidikan || "kuliah",
        nim_nisn: nim_nisn || "-",
        institusi: institusi || "-",
        program_studi: program_studi || "-",
        cv_url: cv_url || null,
        onboarding_status: onboarding_status || "step_1_selesai",
      });
    }

    const updatedUser = await findUserByIdWithPassword(userId);

    successResponse(res, "Profile updated successfully", {
      id: updatedUser?.id,
      email: updatedUser?.email,
      role: updatedUser?.role,
      name: profil?.nama_lengkap,
      isGoogleConnected: !!updatedUser?.google_id,
      hasPassword: !!updatedUser?.password_hash,
      emailVerified: updatedUser?.email_verified,
      profile: profil
        ? {
            nama_lengkap: profil.nama_lengkap,
            jenjang_pendidikan: profil.jenjang_pendidikan,
            nim_nisn: profil.nim_nisn,
            institusi: profil.institusi,
            program_studi: profil.program_studi,
            cv_url: profil.cv_url,
            onboarding_status: profil.onboarding_status,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const getProfilPengajuan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const pengajuan = await findPengajuanByUserId(userId);
    successResponse(res, "Application retrieved successfully", pengajuan);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ status: "error", message: "Password baru minimal 6 karakter" });
    }

    const user = await findUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ status: "error", message: "Password saat ini wajib diisi" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ status: "error", message: "Password saat ini salah" });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await modifyUser(userId, { password_hash: hashed });

    successResponse(res, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

export const connectGoogle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { token, currentPassword } = req.body;
    if (!token) {
      return res.status(400).json({ status: "error", message: "Google ID Token is required" });
    }

    const user = await findUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        status: "error",
        message: "Anda harus membuat kata sandi terlebih dahulu sebelum menghubungkan akun Google.",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini wajib diisi" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini salah" });
    }

    const googlePayload = await verifyGoogleIdToken(token);
    if (!googlePayload) {
      return res.status(400).json({ status: "error", message: "Token Google tidak valid" });
    }

    const existingUser = await findUserByGoogleId(googlePayload.googleId);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        status: "error",
        message: "Akun Google ini sudah terhubung dengan akun lain",
      });
    }

    await modifyUser(userId, { google_id: googlePayload.googleId });

    successResponse(res, "Akun Google berhasil dihubungkan");
  } catch (err) {
    next(err);
  }
};

export const disconnectGoogle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const user = await findUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (!user.email_verified) {
      return res.status(400).json({
        status: "error",
        message: "Anda harus menyambungkan email ke akun terlebih dahulu sebelum memutuskan akun Google.",
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        status: "error",
        message: "Anda harus membuat kata sandi terlebih dahulu sebelum memutuskan akun Google agar tetap dapat masuk ke sistem.",
      });
    }

    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini wajib diisi" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini salah" });
    }

    await modifyUser(userId, { google_id: null });

    successResponse(res, "Akun Google berhasil diputuskan");
  } catch (err) {
    next(err);
  }
};

export const requestChangeEmailOTP = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { newEmail, currentPassword } = req.body;
    if (!newEmail) {
      return res.status(400).json({ status: "error", message: "Email baru wajib diisi" });
    }

    const user = await findUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        status: "error",
        message: "Anda harus membuat kata sandi terlebih dahulu sebelum mengubah email.",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini wajib diisi" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ status: "error", message: "Password saat ini salah" });
    }

    if (user.email === newEmail) {
      return res.status(400).json({ status: "error", message: "Email baru sama dengan email saat ini" });
    }

    const existingUser = await findUserByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ status: "error", message: "Email sudah digunakan oleh akun lain" });
    }

    await deleteOtp(newEmail, "change_email");

    const otp = generateOtp();
    const expiresAt = localDayjs().add(1, "hour").toDate();

    await insertOtp({
      email: newEmail,
      otp_code: otp,
      type: "change_email",
      expires_at: expiresAt,
    });

    const emailMsg = getKonfirmasiPerubahanEmailMessage(otp);
    await sendMail({
      to: newEmail,
      subject: emailMsg.subject,
      html: emailMsg.html,
    });

    successResponse(res, "OTP telah dikirim ke email baru");
  } catch (err) {
    next(err);
  }
};

export const confirmChangeEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ status: "error", message: "Email baru dan OTP wajib diisi" });
    }

    const pendingOtp = await findOtp(newEmail, "change_email", otp);
    if (!pendingOtp) {
      return res.status(400).json({ status: "error", message: "OTP tidak valid" });
    }

    if (localDayjs().isAfter(localDayjs(pendingOtp.expires_at))) {
      return res.status(400).json({ status: "error", message: "OTP sudah kedaluwarsa" });
    }

    const existingUser = await findUserByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ status: "error", message: "Email sudah digunakan oleh akun lain" });
    }

    await withTransaction(async (client) => {
      await modifyUser(userId, { email: newEmail }, client);
      await deleteOtp(newEmail, "change_email", client);
    });

    successResponse(res, "Email berhasil diubah");
  } catch (err) {
    next(err);
  }
};

export const getInstitusiSuggestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string | undefined;
    const data = await findInstitusiSuggestions(q);
    successResponse(res, "Institusi suggestions retrieved successfully", data);
  } catch (err) {
    next(err);
  }
};

export const getProdiSuggestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string | undefined;
    const institusi = req.query.institusi as string | undefined;
    const data = await findProdiSuggestions(q, institusi);
    successResponse(res, "Prodi suggestions retrieved successfully", data);
  } catch (err) {
    next(err);
  }
};
