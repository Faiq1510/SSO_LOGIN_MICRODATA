import { Router } from "express";
import {
  login,
  register,
  googleLogin,
  refreshToken,
  requestConfirmation,
  confirmEmailHandler,
  forgotPassword,
  resetPasswordHandler,
  ssoCallback,
  ssoExchange,
} from "../controllers/auth.controller";

const router = Router();

/**
 * @swagger
 * /auth/google/client-id:
 *   get:
 *     summary: Get Google Client ID for frontend initialization
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Client ID retrieved successfully
 */
router.get("/google/client-id", (_req, res) => {
  res.json({
    status: "success",
    data: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
    },
  });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate with Google ID Token via Request Body or Authorization Header
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token (optional if Authorization header is used)
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid token
 */
router.post("/google", googleLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", refreshToken);

router.post("/email/request-confirmation", requestConfirmation);
router.post("/email/confirm", confirmEmailHandler);
router.post("/password/forgot", forgotPassword);
router.post("/password/reset", resetPasswordHandler);

/**
 * @swagger
 * /auth/sso/callback:
 *   get:
 *     summary: SSO Callback authentication endpoint
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sso_token
 *         schema:
 *           type: string
 *         required: true
 *         description: JWT SSO token
 *     responses:
 *       200:
 *         description: SSO login successful
 *       400:
 *         description: Parameter sso_token tidak ditemukan
 *       401:
 *         description: SSO Token tidak valid atau sudah kadaluarsa
 *   post:
 *     summary: SSO Callback authentication endpoint
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sso_token
 *             properties:
 *               sso_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: SSO login successful
 *       400:
 *         description: Parameter sso_token tidak ditemukan
 *       401:
 *         description: SSO Token tidak valid atau sudah kadaluarsa
 */
router.get("/sso/callback", ssoCallback);
router.post("/sso/callback", ssoCallback);
router.post("/sso/exchange", ssoExchange);

export default router;
