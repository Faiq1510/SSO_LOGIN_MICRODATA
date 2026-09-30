import app from "./app";
import { ensureBucketExists } from "./config/minio";

const PORT = process.env.APP_PORT || 3000;

ensureBucketExists().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
