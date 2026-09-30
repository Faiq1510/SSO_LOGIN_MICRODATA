package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	"saims-backend/internal/domain"

	"github.com/google/uuid"
)

type AssetImageService interface {
	UploadAssetImage(ctx context.Context, assetID string, file *multipart.FileHeader, uploaderID string, isPrimary bool) (*domain.AssetImage, error)
	GetImagesByAssetID(ctx context.Context, assetID string) ([]map[string]interface{}, error)
	DeleteImage(ctx context.Context, imageID string) error
	SetPrimaryImage(ctx context.Context, assetID, imageID string) error
}

type assetImageService struct {
	repo           domain.AssetImageRepository
	storageService StorageService
	bucketName     string
	publicEndpoint string
}

func NewAssetImageService(repo domain.AssetImageRepository, storageService StorageService, bucketName, publicEndpoint string) AssetImageService {
	return &assetImageService{
		repo:           repo,
		storageService: storageService,
		bucketName:     bucketName,
		publicEndpoint: normalizeEndpoint(publicEndpoint),
	}
}

func normalizeEndpoint(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimRight(raw, "/")
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	return "http://" + raw
}

func (s *assetImageService) rewriteToPublicURL(in *url.URL) string {
	if in == nil {
		return ""
	}
	if s.publicEndpoint == "" {
		return in.String()
	}
	publicURL, err := url.Parse(s.publicEndpoint)
	if err != nil || publicURL.Host == "" {
		return in.String()
	}

	cloned := *in
	cloned.Scheme = publicURL.Scheme
	cloned.Host = publicURL.Host
	return cloned.String()
}

func (s *assetImageService) UploadAssetImage(ctx context.Context, assetID string, fileHeader *multipart.FileHeader, uploaderID string, isPrimary bool) (*domain.AssetImage, error) {
	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Generate unique object key
	fileID := uuid.New().String()
	ext := filepath.Ext(fileHeader.Filename)
	objectKey := fmt.Sprintf("assets/%s/%s%s", assetID, fileID, ext)

	// Upload to MinIO
	err = s.storageService.UploadFile(ctx, s.bucketName, objectKey, file, fileHeader.Size, fileHeader.Header.Get("Content-Type"))
	if err != nil {
		return nil, fmt.Errorf("failed to upload file to storage: %w", err)
	}

	var upID *string
	if uploaderID != "" {
		upID = &uploaderID
	}

	// Save metadata to DB
	assetImage := &domain.AssetImage{
		AssetID:    assetID,
		ObjectKey:  objectKey,
		BucketName: s.bucketName,
		FileName:   fileHeader.Filename,
		MimeType:   fileHeader.Header.Get("Content-Type"),
		FileSize:   fileHeader.Size,
		IsPrimary:  isPrimary,
		UploadedBy: upID,
	}

	err = s.repo.Create(assetImage)
	if err != nil {
		// Rollback object in MinIO if DB fails
		_ = s.storageService.DeleteFile(ctx, s.bucketName, objectKey)
		return nil, fmt.Errorf("failed to save image metadata: %w", err)
	}

	// If this was marked as primary, ensure no other image is primary
	if isPrimary {
		_ = s.repo.SetPrimary(assetID, assetImage.ID)
	}

	return assetImage, nil
}

func (s *assetImageService) GetImagesByAssetID(ctx context.Context, assetID string) ([]map[string]interface{}, error) {
	images, err := s.repo.FindByAssetID(assetID)
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, img := range images {
		// Generate presigned URL (valid for 1 hour)
		url, err := s.storageService.GeneratePresignedURL(ctx, img.BucketName, img.ObjectKey, time.Hour)
		urlStr := ""
		if err == nil && url != nil {
			urlStr = s.rewriteToPublicURL(url)
		}

		result = append(result, map[string]interface{}{
			"id":         img.ID,
			"asset_id":   img.AssetID,
			"file_name":  img.FileName,
			"is_primary": img.IsPrimary,
			"sort_order": img.SortOrder,
			"created_at": img.CreatedAt,
			"image_url":  urlStr,
		})
	}

	return result, nil
}

func (s *assetImageService) DeleteImage(ctx context.Context, imageID string) error {
	img, err := s.repo.FindByID(imageID)
	if err != nil {
		return errors.New("image not found")
	}

	// Delete from storage first
	err = s.storageService.DeleteFile(ctx, img.BucketName, img.ObjectKey)
	if err != nil {
		return fmt.Errorf("failed to delete file from storage: %w", err)
	}

	// Delete from DB
	return s.repo.Delete(imageID)
}

func (s *assetImageService) SetPrimaryImage(ctx context.Context, assetID, imageID string) error {
	return s.repo.SetPrimary(assetID, imageID)
}
