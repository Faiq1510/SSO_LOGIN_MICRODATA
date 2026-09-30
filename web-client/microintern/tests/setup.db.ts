import { vi } from "vitest";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });
process.env.DB_NAME = process.env.TEST_DB_NAME || "microintern_test";

vi.mock("../backend/src/utils/mail", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../backend/src/services/minio.service", () => ({
  uploadFile: vi.fn().mockResolvedValue("https://mock-s3.com/file.pdf"),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getFileBuffer: vi.fn().mockResolvedValue(Buffer.from("mock pdf content")),
  getPublicFileUrl: vi.fn((url: string) => url),
}));

vi.mock("../backend/src/services/pdf.service", () => ({
  generateSuratBalasan: vi.fn().mockResolvedValue("https://mock-s3.com/surat-balasan.pdf"),
  generateSertifikat: vi.fn().mockResolvedValue("https://mock-s3.com/sertifikat.pdf"),
}));
