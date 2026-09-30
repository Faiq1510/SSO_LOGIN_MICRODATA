import { vi } from "vitest";

const mockDbClient = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  release: vi.fn(),
};

export const mockDb = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  connect: vi.fn().mockResolvedValue(mockDbClient),
};

vi.mock("../backend/src/config/database", () => ({
  db: mockDb,
  withTransaction: vi.fn(async (fn: (client: any) => Promise<any>) => fn(mockDb)),
}));

vi.mock("../backend/src/utils/mail", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../backend/src/services/minio.service", () => ({
  uploadFile: vi.fn().mockResolvedValue("https://mock-s3.com/file.pdf"),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../backend/src/services/pdf.service", () => ({
  generateSuratBalasan: vi.fn().mockResolvedValue("https://mock-s3.com/surat-balasan.pdf"),
  generateSertifikat: vi.fn().mockResolvedValue("https://mock-s3.com/sertifikat.pdf"),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue("hashed"),
  },
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue("hashed"),
}));
