package repositories

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/template/go-backend-gin-orm/model"
)

type AnalyticsFilter struct {
	StartTime time.Time
	EndTime   time.Time
	Source    string
}

func (r *LogRepository) GetAnalytics(ctx context.Context, filter AnalyticsFilter) (*model.AnalyticsResponse, error) {
	if filter.Source == "postgres" {
		return r.getAnalyticsPostgres(ctx, filter)
	}
	return r.getAnalyticsClickHouse(ctx, filter)
}

// fmtCH formats a time.Time for embedding directly in ClickHouse SQL strings.
func fmtCH(t time.Time) string {
	return t.UTC().Format("2006-01-02 15:04:05")
}

func (r *LogRepository) getAnalyticsClickHouse(ctx context.Context, filter AnalyticsFilter) (*model.AnalyticsResponse, error) {
	resp := &model.AnalyticsResponse{
		RequestsOverTime:   []model.TimePoint{},
		StatusDistribution: []model.StatusCodePoint{},
		TopEndpoints:       []model.EndpointPoint{},
		TopClientIPs:       []model.IpPoint{},
		MethodDistribution: []model.MethodPoint{},
		ErrorsOverTime:     []model.TimePoint{},
		LatencyOverTime:    []model.LatencyPoint{},
	}

	// All timestamps embedded as string literals — no ? params needed for time filters
	start := fmtCH(filter.StartTime)
	end := fmtCH(filter.EndTime)
	timeWhere := fmt.Sprintf("event_time >= '%s' AND event_time <= '%s'", start, end)

	// Auto-bucket granularity
	bucket := "toStartOfMinute"
	diff := filter.EndTime.Sub(filter.StartTime)
	if diff.Hours() > 24 {
		bucket = "toStartOfHour"
	}
	if diff.Hours() > 24*7 {
		bucket = "toStartOfDay"
	}

	// 1. Total Requests, Total Errors, Avg Latency
	err := r.conn.QueryRow(ctx, fmt.Sprintf(
		"SELECT count(), sum(is_error), avg(latency_ms) FROM logs WHERE %s", timeWhere,
	)).Scan(&resp.TotalRequests, &resp.TotalErrors, &resp.AvgLatency)
	if err != nil {
		return nil, fmt.Errorf("summary query: %w", err)
	}

	// 2. Requests Over Time
	err = r.conn.Select(ctx, &resp.RequestsOverTime, fmt.Sprintf(`
		SELECT %s(event_time) as time, count() as count 
		FROM logs 
		WHERE %s
		GROUP BY time 
		ORDER BY time ASC
	`, bucket, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("requests over time: %w", err)
	}
	if resp.RequestsOverTime == nil {
		resp.RequestsOverTime = []model.TimePoint{}
	}

	// 3. Errors Over Time
	err = r.conn.Select(ctx, &resp.ErrorsOverTime, fmt.Sprintf(`
		SELECT %s(event_time) as time, count() as count 
		FROM logs 
		WHERE %s AND is_error = 1
		GROUP BY time 
		ORDER BY time ASC
	`, bucket, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("errors over time: %w", err)
	}
	if resp.ErrorsOverTime == nil {
		resp.ErrorsOverTime = []model.TimePoint{}
	}

	// 4. Avg Latency Over Time
	err = r.conn.Select(ctx, &resp.LatencyOverTime, fmt.Sprintf(`
		SELECT %s(event_time) as time, avg(latency_ms) as avg_latency 
		FROM logs 
		WHERE %s
		GROUP BY time 
		ORDER BY time ASC
	`, bucket, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("latency over time: %w", err)
	}
	if resp.LatencyOverTime == nil {
		resp.LatencyOverTime = []model.LatencyPoint{}
	}

	// 5. Status Code Distribution
	err = r.conn.Select(ctx, &resp.StatusDistribution, fmt.Sprintf(`
		SELECT status_code, count() as count 
		FROM logs 
		WHERE %s
		GROUP BY status_code 
		ORDER BY count DESC
	`, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("status distribution: %w", err)
	}
	if resp.StatusDistribution == nil {
		resp.StatusDistribution = []model.StatusCodePoint{}
	}

	// 6. Method Distribution
	err = r.conn.Select(ctx, &resp.MethodDistribution, fmt.Sprintf(`
		SELECT method, count() as count 
		FROM logs 
		WHERE %s
		GROUP BY method 
		ORDER BY count DESC
	`, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("method distribution: %w", err)
	}
	if resp.MethodDistribution == nil {
		resp.MethodDistribution = []model.MethodPoint{}
	}

	// 7. Top Endpoints
	err = r.conn.Select(ctx, &resp.TopEndpoints, fmt.Sprintf(`
		SELECT path, count() as count 
		FROM logs 
		WHERE %s
		GROUP BY path 
		ORDER BY count DESC 
		LIMIT 10
	`, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("top endpoints: %w", err)
	}
	if resp.TopEndpoints == nil {
		resp.TopEndpoints = []model.EndpointPoint{}
	}

	// 8. Top Client IPs
	err = r.conn.Select(ctx, &resp.TopClientIPs, fmt.Sprintf(`
		SELECT client_ip, count() as count 
		FROM logs 
		WHERE %s
		GROUP BY client_ip 
		ORDER BY count DESC 
		LIMIT 10
	`, timeWhere))
	if err != nil {
		return nil, fmt.Errorf("top ips: %w", err)
	}
	if resp.TopClientIPs == nil {
		resp.TopClientIPs = []model.IpPoint{}
	}

	// Sanitize NaN values before JSON marshaling
	if math.IsNaN(resp.AvgLatency) {
		resp.AvgLatency = 0
	}
	for i := range resp.LatencyOverTime {
		if math.IsNaN(resp.LatencyOverTime[i].AvgLatency) {
			resp.LatencyOverTime[i].AvgLatency = 0
		}
	}

	return resp, nil
}

func (r *LogRepository) getAnalyticsPostgres(ctx context.Context, filter AnalyticsFilter) (*model.AnalyticsResponse, error) {
	resp := &model.AnalyticsResponse{
		RequestsOverTime:   []model.TimePoint{},
		StatusDistribution: []model.StatusCodePoint{},
		TopEndpoints:       []model.EndpointPoint{},
		TopClientIPs:       []model.IpPoint{},
		MethodDistribution: []model.MethodPoint{},
		ErrorsOverTime:     []model.TimePoint{},
		LatencyOverTime:    []model.LatencyPoint{},
	}

	query := r.gormDB.WithContext(ctx).Model(&model.BackupLog{})
	if !filter.StartTime.IsZero() {
		query = query.Where(`"eventTime" >= ?`, filter.StartTime)
	}
	if !filter.EndTime.IsZero() {
		query = query.Where(`"eventTime" <= ?`, filter.EndTime)
	}

	var total int64
	query.Count(&total)
	resp.TotalRequests = uint64(total)

	var errors int64
	query.Where(`"isError" = ?`, 1).Count(&errors)
	resp.TotalErrors = uint64(errors)

	type LatencyResult struct {
		AvgLatency float64
	}
	var lat LatencyResult
	query.Select(`AVG("latencyMs") as avg_latency`).Scan(&lat)
	resp.AvgLatency = lat.AvgLatency

	query.Select(`"statusCode" as status_code, count(*) as count`).
		Group(`"statusCode"`).Order("count DESC").Scan(&resp.StatusDistribution)

	query.Select(`"path", count(*) as count`).
		Group(`"path"`).Order("count DESC").Limit(10).Scan(&resp.TopEndpoints)

	query.Select(`"clientIp" as client_ip, count(*) as count`).
		Group(`"clientIp"`).Order("count DESC").Limit(10).Scan(&resp.TopClientIPs)

	if resp.StatusDistribution == nil {
		resp.StatusDistribution = []model.StatusCodePoint{}
	}
	if resp.TopEndpoints == nil {
		resp.TopEndpoints = []model.EndpointPoint{}
	}
	if resp.TopClientIPs == nil {
		resp.TopClientIPs = []model.IpPoint{}
	}
	return resp, nil
}
