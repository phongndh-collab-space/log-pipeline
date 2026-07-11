package services

import (
	"context"
	"time"

	"github.com/template/go-backend-gin-orm/model"
	"github.com/template/go-backend-gin-orm/repositories"
)

type LogService struct {
	repo *repositories.LogRepository
}

func NewLogService(repo *repositories.LogRepository) *LogService {
	return &LogService{repo: repo}
}

func (s *LogService) GetRecentLogs(ctx context.Context, page int, limit int, search string, status string, startTime time.Time, endTime time.Time) ([]model.Log, int64, error) {
	if limit <= 0 {
		limit = 100 // default limit
	} else if limit > 1000 {
		limit = 1000 // max limit
	}

	if page <= 0 {
		page = 1
	}

	offset := (page - 1) * limit
	return s.repo.GetLogs(ctx, limit, offset, search, status, startTime, endTime)
}

func (s *LogService) GetBackupLogs(ctx context.Context, page int, limit int, search string, status string, startTime time.Time, endTime time.Time) ([]model.BackupLog, int64, error) {
	if limit <= 0 {
		limit = 100 // default limit
	} else if limit > 1000 {
		limit = 1000 // max limit
	}

	if page <= 0 {
		page = 1
	}

	offset := (page - 1) * limit
	return s.repo.GetBackupLogs(ctx, limit, offset, search, status, startTime, endTime)
}

func (s *LogService) GetAnalytics(ctx context.Context, filter repositories.AnalyticsFilter) (*model.AnalyticsResponse, error) {
	return s.repo.GetAnalytics(ctx, filter)
}
