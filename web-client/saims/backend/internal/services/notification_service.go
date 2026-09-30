package services

import (
	"log"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
)

type NotificationService interface {
	CreateNotificationForRole(role string, title string, message string, notifType string) error
	CreateNotificationForUser(userID string, title string, message string, notifType string) error
	GetUserNotifications(userID string) ([]domain.Notification, error)
	GetUnreadCount(userID string) (int64, error)
	MarkAsRead(id string, userID string) error
	MarkAllAsRead(userID string) error
}

type notificationService struct {
	notificationRepo domain.NotificationRepository
	userRepo         repositories.UserRepository
}

func NewNotificationService(notifRepo domain.NotificationRepository, userRepo repositories.UserRepository) NotificationService {
	return &notificationService{
		notificationRepo: notifRepo,
		userRepo:         userRepo,
	}
}

func (s *notificationService) CreateNotificationForRole(role string, title string, message string, notifType string) error {
	users, err := s.userRepo.FindByRole(role)
	if err != nil {
		return err
	}

	for _, user := range users {
		notif := &domain.Notification{
			UserID:  user.ID,
			Title:   title,
			Message: message,
			Type:    notifType,
		}
		if err := s.notificationRepo.Create(notif); err != nil {
			log.Printf("[Notification Error] Gagal membuat notifikasi untuk user %s: %v", user.ID, err)
		}
	}
	return nil
}

func (s *notificationService) CreateNotificationForUser(userID string, title string, message string, notifType string) error {
	notif := &domain.Notification{
		UserID:  userID,
		Title:   title,
		Message: message,
		Type:    notifType,
	}
	return s.notificationRepo.Create(notif)
}

func (s *notificationService) GetUserNotifications(userID string) ([]domain.Notification, error) {
	return s.notificationRepo.FindByUserID(userID)
}

func (s *notificationService) GetUnreadCount(userID string) (int64, error) {
	return s.notificationRepo.CountUnread(userID)
}

func (s *notificationService) MarkAsRead(id string, userID string) error {
	return s.notificationRepo.MarkAsRead(id, userID)
}

func (s *notificationService) MarkAllAsRead(userID string) error {
	return s.notificationRepo.MarkAllAsRead(userID)
}
