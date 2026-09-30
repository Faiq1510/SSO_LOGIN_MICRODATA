import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import profilRoutes from "./routes/profil.routes";
import adminSettingsRoutes from "./routes/admin-settings.routes";
import dashboardAdminRoutes from "./routes/dashboard-admin.routes";
import uploadRoutes from "./routes/upload.routes";
import pendaftaranRoutes from "./routes/pendaftaran.routes";
import adminPesertaRoutes from "./routes/admin-peserta.routes";
import presensiRoutes from "./routes/presensi.routes";
import izinRoutes from "./routes/izin.routes";
import adminPresensiRoutes from "./routes/admin-presensi.routes";
import adminIzinRoutes from "./routes/admin-izin.routes";
import adminLaporanRoutes from "./routes/admin-laporan.routes";
import penilaianRoutes from "./routes/penilaian.routes";
import adminNotificationsRoutes from "./routes/admin-notifications.routes";
import templatePenilaianRoutes from "./routes/template-penilaian.routes";
import { errorHandler } from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import { apiLimiter } from "./middlewares/rateLimiter.middleware";
import { ssoCallback } from "./controllers/auth.controller";
import "./config/database";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOriginsEnv = process.env.CORS_ORIGIN;
      const allowedOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(",").map((o) => o.trim()) : [];

      const isAllowed = allowedOrigins.includes(origin) || /^https?:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/", apiLimiter);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.get("/sso/callback", ssoCallback);
app.post("/sso/callback", ssoCallback);
app.use("/api/profil", profilRoutes);
app.use("/api/admin", adminSettingsRoutes);
app.use("/api/admin", dashboardAdminRoutes);
app.use("/api/admin/peserta", adminPesertaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pendaftaran", pendaftaranRoutes);
app.use("/api/presensi", presensiRoutes);
app.use("/api/izin", izinRoutes);
app.use("/api/admin/presensi", adminPresensiRoutes);
app.use("/api/admin/izin", adminIzinRoutes);
app.use("/api/admin/laporan", adminLaporanRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api", penilaianRoutes);
app.use("/api", templatePenilaianRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);

export default app;
