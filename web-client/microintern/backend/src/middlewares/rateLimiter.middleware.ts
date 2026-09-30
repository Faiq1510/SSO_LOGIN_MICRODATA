import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    status: 429,
    message: "Terlalu banyak permintaan, silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
