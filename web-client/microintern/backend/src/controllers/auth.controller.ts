import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  registerUser,
  googleLoginOrRegister,
  refreshAccessToken,
  requestEmailConfirmation,
  confirmEmail,
  requestPasswordReset,
  resetPassword,
  ssoLogin,
  ssoOidcLogin,
} from "../services/auth.service";
import { successResponse } from "../utils/response";
import { verifyGoogleIdToken } from "../utils/googleAuth";

export const login = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, password, token } = req.body;

    if (token) {
      const googlePayload = await verifyGoogleIdToken(token);
      if (!googlePayload) {
        return res.status(401).json({ status: "error", message: "Invalid Google ID Token" });
      }
      const result = await googleLoginOrRegister(googlePayload);
      return successResponse(res, "Google login successful", result);
    } else {
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email and password are required, or a Google token must be provided.",
        });
      }
      const result = await loginUser(email, password);
      return successResponse(res, "Login successful", result);
    }
  } catch (err: any) {
    res.status(401).json({ status: "error", message: err.message });
  }
};

export const register = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required" });
    }
    const result = await registerUser(email, password);
    successResponse(res, "Registration successful", result);
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const googleLogin = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const token = req.body.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Google ID Token is required. Pass in request body or Authorization header.",
      });
    }

    const verifiedPayload = await verifyGoogleIdToken(token);
    if (!verifiedPayload) {
      return res.status(401).json({ status: "error", message: "Invalid Google ID Token" });
    }

    const result = await googleLoginOrRegister(verifiedPayload);
    successResponse(res, "Google authentication successful", result);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ status: "error", message: "Refresh token is required" });
    }
    const accessToken = await refreshAccessToken(refreshToken);
    successResponse(res, "Token refreshed successfully", { accessToken });
  } catch (err: any) {
    res.status(401).json({ status: "error", message: err.message });
  }
};

export const requestConfirmation = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: "error", message: "Email is required" });
    await requestEmailConfirmation(email);
    successResponse(res, "Confirmation email sent");
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const confirmEmailHandler = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ status: "error", message: "Email and OTP are required" });
    await confirmEmail(email, otp);
    successResponse(res, "Email confirmed successfully");
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const forgotPassword = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: "error", message: "Email is required" });
    await requestPasswordReset(email);
    successResponse(res, "Password reset email sent");
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ status: "error", message: "Email, OTP, and newPassword are required" });
    await resetPassword(email, otp, newPassword);
    successResponse(res, "Password reset successfully");
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const ssoCallback = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const ssoToken = (req.query.sso_token || req.body?.sso_token) as string;

    if (!ssoToken) {
      return res.status(400).json({ status: "error", message: "Parameter sso_token tidak ditemukan" });
    }

    const result = await ssoLogin(ssoToken);

    const secFetchMode = req.headers["sec-fetch-mode"];
    const acceptHeader = req.headers.accept || "";

    const isBrowserNavigation = secFetchMode === "navigate" || (acceptHeader.includes("text/html") && !acceptHeader.includes("application/json")) || req.query.redirect === "true";

    if (isBrowserNavigation) {
      const allowedOriginsEnv = process.env.CORS_ORIGIN;
      const frontendUrl = allowedOriginsEnv ? allowedOriginsEnv.split(",")[0].trim() : "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/sso/callback?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
      return res.redirect(redirectUrl);
    }

    return successResponse(res, "SSO login successful", result);
  } catch (err: any) {
    return res.status(401).json({ status: "error", message: err.message || "SSO Token tidak valid atau sudah kadaluarsa" });
  }
};

export const ssoExchange = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { code, code_verifier } = req.body;
    if (!code || !code_verifier) {
      return res.status(400).json({ status: "error", message: "Parameter code dan code_verifier wajib disertakan" });
    }

    const result = await ssoOidcLogin(code, code_verifier);
    return successResponse(res, "SSO login successful", result);
  } catch (err: any) {
    return res.status(400).json({ status: "error", message: err.message });
  }
};
