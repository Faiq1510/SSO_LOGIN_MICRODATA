import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "microintern";

export const ensureBucketExists = async () => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET, "us-east-1");

      const policy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      });
      await minioClient.setBucketPolicy(MINIO_BUCKET, policy);
      console.log(`Bucket '${MINIO_BUCKET}' created and policy configured.`);
    } else {
      console.log(`Bucket '${MINIO_BUCKET}' already exists.`);
    }
  } catch (error) {
    console.error("Failed to ensure MinIO bucket exists:", error);
  }
};
