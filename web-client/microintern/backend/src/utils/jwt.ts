import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_secret_development_only";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret_development_only";

const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || "15m";

export const generateAccessToken = (payload: object, options?: SignOptions) => {
  const defaultOptions: SignOptions = { expiresIn: JWT_EXPIRATION_TIME as SignOptions["expiresIn"] };
  return jwt.sign(payload, ACCESS_SECRET, { ...defaultOptions, ...options });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const generateRefreshToken = (payload: object, options?: SignOptions) => {
  return jwt.sign(payload, REFRESH_SECRET, options);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
