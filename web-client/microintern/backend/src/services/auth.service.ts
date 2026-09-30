import bcrypt from "bcrypt";
import { withTransaction } from "../config/database";
import { findUserByEmail, findUserByEmailWithPassword, findUserByGoogleId, insertUser, modifyUser, findUserById, findUserByIdWithPassword } from "../repositories/user.repository";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { GooglePayload } from "../utils/googleAuth";
import { sendMail } from "../utils/mail";
import { getKonfirmasiEmailMessage, getResetPasswordMessage } from "../config/message";
import { generateOtp } from "../utils/otp";
import { insertOtp, findOtp, deleteOtp } from "../repositories/pending-otp.repository";
import { localDayjs } from "../utils/date";

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmailWithPassword(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.password) {
    throw new Error("This account is configured for Google login. Please use Google Login.");
  }

  if (!user.email_verified) {
    throw new Error("Please confirm your email address before logging in.");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role }, { expiresIn: "7d" });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || null,
    },
  };
};

export const registerUser = async (email: string, password: string) => {
  const existing = await findUserByEmailWithPassword(email);
  if (existing) {
    if (existing.email_verified) {
      throw new Error("Email is already registered");
    } else {
      // User exists but not verified, update password and resend OTP
      const passwordHash = await bcrypt.hash(password, 10);
      await modifyUser(existing.id, { password_hash: passwordHash });
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await insertUser({
      email,
      password_hash: passwordHash,
      role: "peserta",
      email_verified: false,
    });
  }

  // Automatically request email confirmation upon registration
  await requestEmailConfirmation(email);

  return {
    message: "Silakan periksa email Anda untuk memverifikasi akun (OTP).",
  };
};

export const googleLoginOrRegister = async (googlePayload: GooglePayload) => {
  let user = await findUserByGoogleId(googlePayload.googleId);

  if (!user) {
    user = await findUserByEmail(googlePayload.email);

    if (user) {
      await modifyUser(user.id, {
        google_id: googlePayload.googleId,
        email_verified: true,
      });
      user = await findUserById(user.id);
    } else {
      user = await insertUser({
        email: googlePayload.email,
        google_id: googlePayload.googleId,
        role: "peserta",
        email_verified: true,
      });
    }
  }

  if (!user) {
    throw new Error("Failed to process Google authentication");
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role }, { expiresIn: "7d" });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || googlePayload.name || null,
    },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken) as JwtPayload;

    const user = await findUserById(decoded.id);
    if (!user) {
      throw new Error("User no longer exists");
    }

    return generateAccessToken({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
};

export const requestEmailConfirmation = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.email_verified) {
    throw new Error("Email is already verified");
  }

  // Delete existing OTPs for this type
  await deleteOtp(email, "email_confirmation");

  const otp = generateOtp();
  const expiresAt = localDayjs().add(1, "hour").toDate();

  await insertOtp({
    email,
    otp_code: otp,
    type: "email_confirmation",
    expires_at: expiresAt,
  });

  const emailMsg = getKonfirmasiEmailMessage(otp);
  await sendMail({
    to: email,
    subject: emailMsg.subject,
    html: emailMsg.html,
  });
};

export const confirmEmail = async (email: string, otp: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const pendingOtp = await findOtp(email, "email_confirmation", otp);
  if (!pendingOtp) {
    throw new Error("Invalid OTP");
  }

  if (localDayjs().isAfter(localDayjs(pendingOtp.expires_at))) {
    throw new Error("OTP has expired");
  }

  await withTransaction(async (client) => {
    await modifyUser(user.id, { email_verified: true }, client);
    await deleteOtp(email, "email_confirmation", client);
  });
};

export const requestPasswordReset = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error("Cannot reset password for Google-linked accounts.");
  }

  await deleteOtp(email, "forgot_password");

  const otp = generateOtp();
  const expiresAt = localDayjs().add(1, "hour").toDate();

  await insertOtp({
    email,
    otp_code: otp,
    type: "forgot_password",
    expires_at: expiresAt,
  });

  const emailMsg = getResetPasswordMessage(otp);
  await sendMail({
    to: email,
    subject: emailMsg.subject,
    html: emailMsg.html,
  });
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const user = await findUserByEmailWithPassword(email);
  if (!user) {
    throw new Error("User not found");
  }

  const pendingOtp = await findOtp(email, "forgot_password", otp);
  if (!pendingOtp) {
    throw new Error("Invalid OTP");
  }

  if (localDayjs().isAfter(localDayjs(pendingOtp.expires_at))) {
    throw new Error("OTP has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await withTransaction(async (client) => {
    await modifyUser(user.id, { password_hash: passwordHash }, client);
    await deleteOtp(email, "forgot_password", client);
  });
};

interface SsoJwtPayload extends JwtPayload {
  user_id_external?: string;
}

export const ssoLogin = async (ssoToken: string) => {
  const primarySecret = process.env.SSO_SHARED_SECRET;

  if (!primarySecret) {
    throw new Error("SSO_SHARED_SECRET environment variable is not configured");
  }

  const expectedIssuer = process.env.SSO_ISSUER || "portal-login-microdata";

  let verifiedPayload: SsoJwtPayload | null = null;

  try {
    const decoded = jwt.verify(ssoToken, primarySecret, {
      algorithms: ["HS256"],
      issuer: expectedIssuer,
    }) as SsoJwtPayload;
    verifiedPayload = decoded;
  } catch (_err) {
    throw new Error("SSO Token tidak valid, issuer tidak sesuai, atau sudah kadaluarsa");
  }

  if (!verifiedPayload) {
    throw new Error("SSO Token tidak valid, issuer tidak sesuai, atau sudah kadaluarsa");
  }

  const payload: SsoJwtPayload = verifiedPayload;

  if (payload.iss !== expectedIssuer) {
    throw new Error("Issuer token tidak sesuai");
  }

  if (!payload.iat) {
    throw new Error("Token tidak memiliki timestamp issued-at (iat)");
  }

  const now = Math.floor(Date.now() / 1000);
  const maxTokenAge = 300;
  if (now - payload.iat > maxTokenAge) {
    throw new Error("Token terlalu lama");
  }

  const { user_id_external } = payload;

  if (!user_id_external) {
    throw new Error("user_id_external tidak ditemukan dalam token SSO");
  }

  const isExtUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id_external);
  if (!isExtUuid) {
    throw new Error("user_id_external harus berupa UUID yang valid");
  }

  const user = await findUserByIdWithPassword(user_id_external);
  if (!user) {
    throw new Error("User tidak ditemukan dalam database. Silakan hubungi administrator.");
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role }, { expiresIn: "7d" });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || null,
    },
  };
};

export const ssoOidcLogin = async (code: string, codeVerifier: string) => {
  const ISSUER = process.env.SSO_ISSUER || "https://procurer-uncouth-animate.ngrok-free.dev";
  const CLIENT_ID = "client-microintern";
  const CLIENT_SECRET = process.env.SSO_SHARED_SECRET;
  const REDIRECT_URI = "http://localhost:5173/sso/callback";

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  // 1. Tukar authorization code ke SSO Provider
  const tokenResponse = await fetch(`${ISSUER}/oidc/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || "Gagal menukar token OIDC dengan SSO");
  }

  // 2. Decode payload id_token
  const payload = JSON.parse(Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString());
  const email = payload.email || `${payload.sub}@microdata.id`;
  const name = payload.name || payload.sub;

  // 3. JIT Provisioning (Cari / Buat akun di microintern_db)
  let user = await findUserByEmail(email);
  if (!user) {
    user = await insertUser({
      email,
      role: "peserta",
      email_verified: true,
    });
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role }, { expiresIn: "7d" });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || name,
    },
  };
};
