package model

import "time"

type TimePoint struct {
	Time  time.Time `json:"time" ch:"time"`
	Count uint64    `json:"count" ch:"count"`
}

type StatusCodePoint struct {
	StatusCode uint16 `json:"status_code" ch:"status_code"`
	Count      uint64 `json:"count" ch:"count"`
}

type EndpointPoint struct {
	Path  string `json:"path" ch:"path"`
	Count uint64 `json:"count" ch:"count"`
}

type IpPoint struct {
	ClientIP string `json:"client_ip" ch:"client_ip"`
	Count    uint64 `json:"count" ch:"count"`
}

type MethodPoint struct {
	Method string `json:"method" ch:"method"`
	Count  uint64 `json:"count" ch:"count"`
}

type LatencyPoint struct {
	Time       time.Time `json:"time" ch:"time"`
	AvgLatency float64   `json:"avg_latency" ch:"avg_latency"`
}

type AnalyticsResponse struct {
	TotalRequests      uint64            `json:"total_requests"`
	TotalErrors        uint64            `json:"total_errors"`
	AvgLatency         float64           `json:"avg_latency"`
	RequestsOverTime   []TimePoint       `json:"requests_over_time"`
	ErrorsOverTime     []TimePoint       `json:"errors_over_time"`
	LatencyOverTime    []LatencyPoint    `json:"latency_over_time"`
	StatusDistribution []StatusCodePoint `json:"status_distribution"`
	MethodDistribution []MethodPoint     `json:"method_distribution"`
	TopEndpoints       []EndpointPoint   `json:"top_endpoints"`
	TopClientIPs       []IpPoint         `json:"top_client_ips"`
}
