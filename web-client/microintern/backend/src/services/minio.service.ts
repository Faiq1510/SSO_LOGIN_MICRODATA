import { minioClient, MINIO_BUCKET } from "../config/minio";
import { Readable } from "stream";

export const uploadFile = async (buffer: Buffer, originalName: string, mimeType: string, folder: string = "general"): Promise<string> => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = originalName.split(".").pop();
  const objectName = `${folder}/${uniqueSuffix}.${ext}`;

  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  return objectName;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  const fullUrlPrefix = `${PUBLIC_URL}/${MINIO_BUCKET}/`;
  let objectName: string;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    if (!filePath.startsWith(fullUrlPrefix)) {
      throw new Error("URL file tidak valid atau bukan dari MinIO.");
    }
    objectName = filePath.replace(fullUrlPrefix, "");
  } else {
    objectName = filePath;
  }
  await minioClient.removeObject(MINIO_BUCKET, objectName);
};

export const getFileBuffer = async (filePath: string): Promise<Buffer> => {
  const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  const fullUrlPrefix = `${PUBLIC_URL}/${MINIO_BUCKET}/`;
  let objectName: string;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    if (filePath.startsWith(fullUrlPrefix)) {
      objectName = filePath.replace(fullUrlPrefix, "");
    } else {
      objectName = filePath.split(`${MINIO_BUCKET}/`).pop() || filePath;
    }
  } else {
    objectName = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  }
  const stream: Readable = await minioClient.getObject(MINIO_BUCKET, objectName);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

export const getPublicFileUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${PUBLIC_URL}/${MINIO_BUCKET}/${cleanPath}`;
};
