package services

import (
	"context"
	"log"
	"strings"
	"time"

	"saims-backend/internal/domain"
)

type GarbageCollectorService interface {
	RunCleanup(ctx context.Context) error
}

type garbageCollectorService struct {
	storageSvc StorageService
	imageRepo  domain.AssetImageRepository
	assetRepo  domain.AssetRepository
	bucketName string
}

func NewGarbageCollectorService(
	storageSvc StorageService,
	imageRepo domain.AssetImageRepository,
	assetRepo domain.AssetRepository,
	bucketName string,
) GarbageCollectorService {
	return &garbageCollectorService{
		storageSvc: storageSvc,
		imageRepo:  imageRepo,
		assetRepo:  assetRepo,
		bucketName: bucketName,
	}
}

func (s *garbageCollectorService) RunCleanup(ctx context.Context) error {
	log.Println("[GC] Memulai Garbage Collector MinIO...")

	// 1. Ambil semua file di MinIO dengan prefix 'assets/'
	minioObjects, err := s.storageSvc.ListObjects(ctx, s.bucketName, "assets/")
	if err != nil {
		log.Printf("[GC ERROR] Gagal list objects dari MinIO: %v", err)
		return err
	}

	// 2. Ambil semua object keys dari database
	dbKeys, err := s.imageRepo.FindAllObjectKeys()
	if err != nil {
		log.Printf("[GC ERROR] Gagal list object keys dari database: %v", err)
		return err
	}

	// Buat map untuk pencarian cepat (O(1))
	dbKeysMap := make(map[string]bool)
	for _, key := range dbKeys {
		dbKeysMap[key] = true
	}

	// 3. Bandingkan: Temukan file orphan (ada di MinIO tapi tidak ada di DB)
	var orphanMoved int
	for _, obj := range minioObjects {
		// Jika object key tidak ada di DB, berarti orphan
		if !dbKeysMap[obj.Key] {
			// obj.Key biasanya format: assets/{assetID}/{filename}
			// Kita pindahkan ke: trash/{assetID}/{filename}
			trashKey := strings.Replace(obj.Key, "assets/", "trash/", 1)

			// Copy ke trash
			if err := s.storageSvc.CopyObject(ctx, s.bucketName, obj.Key, trashKey); err != nil {
				log.Printf("[GC ERROR] Gagal copy %s ke %s: %v", obj.Key, trashKey, err)
				continue
			}

			// Hapus file original
			if err := s.storageSvc.DeleteFile(ctx, s.bucketName, obj.Key); err != nil {
				log.Printf("[GC ERROR] Gagal hapus original %s: %v", obj.Key, err)
				continue
			}

			orphanMoved++
		}
	}

	// 4. Bersihkan Trash Lama (lebih dari 7 hari)
	trashObjects, err := s.storageSvc.ListObjects(ctx, s.bucketName, "trash/")
	if err != nil {
		log.Printf("[GC ERROR] Gagal list objects dari trash MinIO: %v", err)
		return err
	}

	var trashDeleted int
	retentionPeriod := 7 * 24 * time.Hour

	for _, obj := range trashObjects {
		age := time.Since(obj.LastModified)
		if age > retentionPeriod {
			// Hapus permanen
			if err := s.storageSvc.DeleteFile(ctx, s.bucketName, obj.Key); err != nil {
				log.Printf("[GC ERROR] Gagal hapus permanen %s: %v", obj.Key, err)
				continue
			}
			trashDeleted++
		}
	}

	log.Printf("[GC SELESAI] Dipindahkan ke trash: %d file, Dihapus permanen dari trash: %d file", orphanMoved, trashDeleted)

	// 5. Database Cleanup
	log.Println("[GC] Memulai pembersihan aset terhapus di Database (>30 hari)...")
	if err := s.assetRepo.DeleteOldTrash(30); err != nil {
		log.Printf("[GC ERROR] Gagal menghapus trash lama dari database: %v", err)
	} else {
		log.Println("[GC SELESAI] Pembersihan database berhasil.")
	}

	return nil
}
