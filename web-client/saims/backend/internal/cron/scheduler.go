package cron

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/internal/services"
)

type CronScheduler struct {
	cron             *cron.Cron
	borrowingRepo    domain.BorrowingRepository
	maintenanceRepo  repositories.MaintenanceRepository
	userRepo         repositories.UserRepository
	notificationRepo domain.NotificationRepository
	waService        services.WhatsAppService
	gcService        services.GarbageCollectorService
}

func SetupCron(db *gorm.DB, gcService services.GarbageCollectorService) *CronScheduler {
	// Use UTC since Alpine doesn't have tzdata
	c := cron.New(cron.WithLocation(time.UTC))

	scheduler := &CronScheduler{
		cron:             c,
		borrowingRepo:    repositories.NewBorrowingRepository(db),
		maintenanceRepo:  repositories.NewMaintenanceRepository(db),
		userRepo:         repositories.NewUserRepository(db),
		notificationRepo: repositories.NewNotificationRepository(db),
		waService:        services.NewWhatsAppService(),
		gcService:        gcService,
	}

	// Jadwal 1: Reminder Pengembalian (Pagi hari jam 08:00)
	if _, err := c.AddFunc("0 8 * * *", func() {
		log.Println("[CRON] Menjalankan pengecekan pengembalian aset (Pagi)...")
		scheduler.checkDueBorrowings()
	}); err != nil {
		log.Printf("[CRON ERROR] Gagal mendaftarkan Jadwal 1: %v", err)
	}

	// Jadwal 2: Reminder Pengembalian Ekstra (Sore hari jam 16:00)
	// Berguna untuk mengingatkan peminjaman di hari yang sama sebelum staf pulang
	if _, err := c.AddFunc("0 16 * * *", func() {
		log.Println("[CRON] Menjalankan pengecekan pengembalian aset (Sore)...")
		scheduler.checkDueBorrowings()
	}); err != nil {
		log.Printf("[CRON ERROR] Gagal mendaftarkan Jadwal 2: %v", err)
	}

	// Jadwal 3: Reminder Maintenance Harian (Setiap jam 07:00 pagi)
	if _, err := c.AddFunc("0 7 * * *", func() {
		log.Println("[CRON] Menjalankan pengecekan jadwal maintenance...")
		scheduler.checkDueMaintenances()
	}); err != nil {
		log.Printf("[CRON ERROR] Gagal mendaftarkan Jadwal 3: %v", err)
	}

	// Jadwal 4: Garbage Collector MinIO (Setiap hari jam 02:00 WIB)
	if _, err := c.AddFunc("0 2 * * *", func() {
		log.Println("[CRON] Menjalankan Garbage Collector MinIO...")
		if err := scheduler.gcService.RunCleanup(context.Background()); err != nil {
			log.Printf("[CRON ERROR] Garbage Collector gagal: %v", err)
		}
	}); err != nil {
		log.Printf("[CRON ERROR] Gagal mendaftarkan Jadwal 4: %v", err)
	}

	return scheduler
}

func (s *CronScheduler) Start() {
	log.Println("Memulai Cron Job Scheduler...")
	s.cron.Start()
}

func (s *CronScheduler) Stop() {
	s.cron.Stop()
}

func (s *CronScheduler) checkDueBorrowings() {
	log.Println("[CRON] Menjalankan pengecekan pengembalian aset...")
	
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	s.notifyDueBorrowingForDate(today, "HARI INI")
	s.notifyDueBorrowingForDate(tomorrow, "BESOK")
}

func (s *CronScheduler) notifyDueBorrowingForDate(dateStr, dayLabel string) {
	dueBorrowings, err := s.borrowingRepo.FindDueBorrowings(dateStr)
	if err != nil {
		log.Printf("[CRON ERROR] Gagal mencari peminjaman jatuh tempo %s: %v\n", dateStr, err)
		return
	}

	type waJob struct {
		phone   string
		message string
	}
	var waJobs []waJob

	for _, b := range dueBorrowings {
		user, _ := s.userRepo.FindByID(b.UserID)
		if user != nil {
			msg := fmt.Sprintf("Halo %s, ini adalah pengingat otomatis bahwa aset %s yang Anda pinjam dijadwalkan untuk dikembalikan %s (%s). Harap kembalikan tepat waktu.", user.Name, b.AssetName, dayLabel, dateStr)
			
			// System Notification
			go func(userID, message string) {
				_ = s.notificationRepo.Create(&domain.Notification{
					UserID:  userID,
					Title:   "Pengingat Pengembalian",
					Message: message,
					Type:    "borrowing",
				})
			}(user.ID, msg)

			// WhatsApp Notification Queue
			if user.Phone != "" {
				waJobs = append(waJobs, waJob{phone: user.Phone, message: msg})
			}
		}
	}

	// Process WhatsApp notifications sequentially to prevent rate limiting
	if len(waJobs) > 0 {
		go func(jobs []waJob) {
			for _, job := range jobs {
				if err := s.waService.SendMessage(job.phone, job.message); err != nil {
					log.Printf("[WhatsApp Error] Gagal mengirim pengingat ke %s: %v", job.phone, err)
				}
				// 1 second delay between messages
				time.Sleep(1 * time.Second)
			}
		}(waJobs)
	}
}

func (s *CronScheduler) checkDueMaintenances() {
	log.Println("[CRON] Menjalankan pengecekan jadwal maintenance...")
	
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	s.notifyMaintenanceForDate(today, "HARI INI")
	s.notifyMaintenanceForDate(tomorrow, "BESOK")
}

func (s *CronScheduler) notifyMaintenanceForDate(dateStr, dayLabel string) {
	maintenances, err := s.maintenanceRepo.FindMaintenanceByScheduledDate(dateStr)
	if err != nil {
		log.Printf("[CRON ERROR] Gagal mencari maintenance %s: %v\n", dateStr, err)
		return
	}

	type waJob struct {
		phone   string
		message string
	}
	var waJobs []waJob

	for _, m := range maintenances {
		if m.TechnicianID != "" {
			tech, _ := s.userRepo.FindByID(m.TechnicianID)
			if tech != nil {
				notes := m.Notes
				if notes == "" {
					notes = "-"
				}
				msg := fmt.Sprintf("Halo %s, PENGINGAT TUGAS %s:\n\nAnda memiliki jadwal maintenance (%s) untuk aset %s.\nCatatan: %s\n\nSilakan cek sistem SAIMS.", tech.Name, dayLabel, m.Type, m.AssetName, notes)
				
				// System Notification
				go func(userID, message string) {
					_ = s.notificationRepo.Create(&domain.Notification{
						UserID:  userID,
						Title:   "Pengingat Maintenance",
						Message: message,
						Type:    "maintenance",
					})
				}(tech.ID, msg)

				// WhatsApp Notification Queue
				if tech.Phone != "" {
					waJobs = append(waJobs, waJob{phone: tech.Phone, message: msg})
				}
			}
		}
	}

	// Process WhatsApp notifications sequentially to prevent rate limiting
	if len(waJobs) > 0 {
		go func(jobs []waJob) {
			for _, job := range jobs {
				if err := s.waService.SendMessage(job.phone, job.message); err != nil {
					log.Printf("[WhatsApp Error] Gagal mengirim pengingat maintenance ke %s: %v", job.phone, err)
				}
				// 1 second delay between messages
				time.Sleep(1 * time.Second)
			}
		}(waJobs)
	}
}
