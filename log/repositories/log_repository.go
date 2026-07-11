package repositories

import (
	"context"
	"strings"

	"gorm.io/gorm"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/template/go-backend-gin-orm/model"
)

type LogRepository struct {
	conn   driver.Conn
	gormDB *gorm.DB
}

func NewLogRepository(conn driver.Conn, gormDB *gorm.DB) *LogRepository {
	return &LogRepository{conn: conn, gormDB: gormDB}
}

func (r *LogRepository) GetLogs(ctx context.Context, limit int, offset int, search string, status string) ([]model.Log, int64, error) {
	var total uint64
	var whereClauses []string
	var queryParams []any

	if search != "" {
		whereClauses = append(whereClauses, "(path LIKE ? OR service_name LIKE ? OR method LIKE ? OR client_ip LIKE ?)")
		searchWildcard := "%" + search + "%"
		queryParams = append(queryParams, searchWildcard, searchWildcard, searchWildcard, searchWildcard)
	}

	if status == "errors" {
		whereClauses = append(whereClauses, "is_error = 1")
	} else if status == "success" {
		whereClauses = append(whereClauses, "is_error = 0")
	}

	whereSql := ""
	if len(whereClauses) > 0 {
		whereSql = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// 1. Get count
	countQuery := "SELECT count() FROM logs " + whereSql
	err := r.conn.QueryRow(ctx, countQuery, queryParams...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 2. Get logs
	query := "SELECT * FROM logs " + whereSql + " ORDER BY event_time DESC LIMIT ? OFFSET ?"
	
	selectParams := append(queryParams, limit, offset)
	var logs []model.Log
	err = r.conn.Select(ctx, &logs, query, selectParams...)
	if err != nil {
		return nil, 0, err
	}

	if logs == nil {
		logs = []model.Log{}
	}

	return logs, int64(total), nil
}

func (r *LogRepository) GetBackupLogs(ctx context.Context, limit int, offset int, search string, status string) ([]model.BackupLog, int64, error) {
	var total int64
	var logs []model.BackupLog

	query := r.gormDB.WithContext(ctx).Model(&model.BackupLog{})

	if search != "" {
		searchWildcard := "%" + search + "%"
		query = query.Where(`"path" LIKE ? OR "serviceName" LIKE ? OR "method" LIKE ? OR "clientIp" LIKE ?`, 
			searchWildcard, searchWildcard, searchWildcard, searchWildcard)
	}

	if status == "errors" {
		query = query.Where(`"isError" = ?`, 1)
	} else if status == "success" {
		query = query.Where(`"isError" = ?`, 0)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order(`"eventTime" DESC`).Limit(limit).Offset(offset).Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	if logs == nil {
		logs = []model.BackupLog{}
	}

	return logs, total, nil
}

