const MINIO_PUBLIC_URL = import.meta.env.VITE_MINIO_PUBLIC_URL || "http://localhost:9000";
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET || "microintern";

export const resolveFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
    return path;
  }
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${path}`;
};
