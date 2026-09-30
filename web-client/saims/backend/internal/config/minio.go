package config

import (
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// InitMinio initializes and returns a MinIO client instance.
func InitMinio() *minio.Client {
	endpoint := GetEnv("MINIO_ENDPOINT", "localhost:9000")
	accessKeyID := GetEnv("MINIO_ACCESS_KEY", "minioadmin")
	secretAccessKey := GetEnv("MINIO_SECRET_KEY", "minioadmin")
	useSSL := GetEnv("MINIO_USE_SSL", "false") == "true"

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalf("Error initializing MinIO client: %v", err)
	}

	log.Println("MinIO client initialized successfully")
	return minioClient
}
