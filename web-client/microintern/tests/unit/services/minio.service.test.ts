import { describe, it, expect, vi, beforeEach } from "vitest";
import { minioClient, MINIO_BUCKET } from "@backend/config/minio";
import { Readable } from "stream";

vi.mock("@backend/config/minio", () => ({
  minioClient: {
    putObject: vi.fn(),
    removeObject: vi.fn(),
    getObject: vi.fn(),
  },
  MINIO_BUCKET: "test-bucket",
}));

describe("Minio Service Unit Tests", () => {
  let minioService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    minioService = await vi.importActual("@backend/services/minio.service");
  });

  describe("uploadFile", () => {
    it("should upload file buffer to minio client and return object name", async () => {
      vi.mocked(minioClient.putObject).mockResolvedValue({ etag: "etag123", versionId: "v1" } as any);
      const buffer = Buffer.from("test content");

      const result = await minioService.uploadFile(buffer, "test.pdf", "application/pdf", "docs");
      expect(result).toContain("docs/");
      expect(result).toContain(".pdf");
      expect(minioClient.putObject).toHaveBeenCalledWith(MINIO_BUCKET, expect.stringContaining("docs/"), buffer, buffer.length, { "Content-Type": "application/pdf" });
    });
  });

  describe("deleteFile", () => {
    it("should delete object using relative path", async () => {
      vi.mocked(minioClient.removeObject).mockResolvedValue(undefined as any);

      await minioService.deleteFile("docs/sample.pdf");
      expect(minioClient.removeObject).toHaveBeenCalledWith(MINIO_BUCKET, "docs/sample.pdf");
    });

    it("should delete object using full URL", async () => {
      vi.mocked(minioClient.removeObject).mockResolvedValue(undefined as any);
      const fullUrl = `http://localhost:9000/${MINIO_BUCKET}/docs/sample.pdf`;

      await minioService.deleteFile(fullUrl);
      expect(minioClient.removeObject).toHaveBeenCalledWith(MINIO_BUCKET, "docs/sample.pdf");
    });

    it("should throw error if URL is not from MinIO", async () => {
      const invalidUrl = "https://external-s3.com/bucket/file.pdf";
      await expect(minioService.deleteFile(invalidUrl)).rejects.toThrow("URL file tidak valid atau bukan dari MinIO.");
    });
  });

  describe("getFileBuffer", () => {
    it("should get file stream from minio and concatenate into buffer", async () => {
      const stream = new Readable();
      stream.push(Buffer.from("chunk1"));
      stream.push(Buffer.from("chunk2"));
      stream.push(null);

      vi.mocked(minioClient.getObject).mockResolvedValue(stream as any);

      const buffer = await minioService.getFileBuffer("docs/file.txt");
      expect(buffer.toString()).toBe("chunk1chunk2");
      expect(minioClient.getObject).toHaveBeenCalledWith(MINIO_BUCKET, "docs/file.txt");
    });

    it("should resolve relative path with leading slash", async () => {
      const stream = new Readable();
      stream.push(null);
      vi.mocked(minioClient.getObject).mockResolvedValue(stream as any);

      await minioService.getFileBuffer("/docs/file.txt");
      expect(minioClient.getObject).toHaveBeenCalledWith(MINIO_BUCKET, "docs/file.txt");
    });
  });

  describe("getPublicFileUrl", () => {
    it("should return empty string for empty input", () => {
      expect(minioService.getPublicFileUrl(null)).toBe("");
      expect(minioService.getPublicFileUrl("")).toBe("");
    });

    it("should return full URL as-is if already absolute HTTP URL", () => {
      const url = "https://example.com/image.jpg";
      expect(minioService.getPublicFileUrl(url)).toBe(url);
    });

    it("should format relative path into full MinIO URL", () => {
      const relPath = "avatars/user.jpg";
      const expected = `http://localhost:9000/${MINIO_BUCKET}/avatars/user.jpg`;
      expect(minioService.getPublicFileUrl(relPath)).toBe(expected);
    });
  });
});
