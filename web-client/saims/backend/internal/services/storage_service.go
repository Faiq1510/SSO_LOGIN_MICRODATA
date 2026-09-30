package services

import (
	"context"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
)

type ObjectInfo struct {
	Key          string
	Size         int64
	LastModified time.Time
}

type StorageService interface {
	UploadFile(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64, contentType string) error
	GeneratePresignedURL(ctx context.Context, bucketName, objectName string, expires time.Duration) (*url.URL, error)
	DeleteFile(ctx context.Context, bucketName, objectName string) error
	ListObjects(ctx context.Context, bucketName, prefix string) ([]ObjectInfo, error)
	CopyObject(ctx context.Context, bucketName, srcKey, dstKey string) error
}

type minioStorageService struct {
	client *minio.Client
}

func NewStorageService(client *minio.Client) StorageService {
	return &minioStorageService{
		client: client,
	}
}

func (s *minioStorageService) UploadFile(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64, contentType string) error {
	_, err := s.client.PutObject(ctx, bucketName, objectName, reader, objectSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (s *minioStorageService) GeneratePresignedURL(ctx context.Context, bucketName, objectName string, expires time.Duration) (*url.URL, error) {
	// Set request parameters for content-disposition if needed, or leave empty
	reqParams := make(url.Values)
	return s.client.PresignedGetObject(ctx, bucketName, objectName, expires, reqParams)
}

func (s *minioStorageService) DeleteFile(ctx context.Context, bucketName, objectName string) error {
	return s.client.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
}

func (s *minioStorageService) ListObjects(ctx context.Context, bucketName, prefix string) ([]ObjectInfo, error) {
	var objects []ObjectInfo
	opts := minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}
	for object := range s.client.ListObjects(ctx, bucketName, opts) {
		if object.Err != nil {
			return nil, object.Err
		}
		objects = append(objects, ObjectInfo{
			Key:          object.Key,
			Size:         object.Size,
			LastModified: object.LastModified,
		})
	}
	return objects, nil
}

func (s *minioStorageService) CopyObject(ctx context.Context, bucketName, srcKey, dstKey string) error {
	src := minio.CopySrcOptions{
		Bucket: bucketName,
		Object: srcKey,
	}
	dst := minio.CopyDestOptions{
		Bucket: bucketName,
		Object: dstKey,
	}
	_, err := s.client.CopyObject(ctx, dst, src)
	return err
}
