package services

import "saims-backend/internal/domain"

type dashboardService struct {
	repo domain.DashboardRepository
}

func NewDashboardService(repo domain.DashboardRepository) domain.DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetStats() (*domain.DashboardStats, error) {
	return s.repo.GetStats()
}

func (s *dashboardService) GetLandingStats() (*domain.LandingStats, error) {
	stats, err := s.repo.GetLandingStats()
	if err != nil {
		return nil, err
	}
	
	stats.IntegratedModules = 12
	stats.SystemUptime = 99.9

	return stats, nil
}
