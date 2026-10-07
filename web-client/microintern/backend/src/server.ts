import app from "./app";
import { ensureBucketExists } from "./config/minio";
import { databaseReady } from "./config/database";

const PORT = process.env.APP_PORT || 3000;

async function startServer() {
  await databaseReady;
  await ensureBucketExists();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("❌ Backend gagal dijalankan:", error);
  process.exit(1);
});
