package model

import (
	"time"
)

type Log struct {
	EventTime   time.Time `ch:"event_time" json:"event_time"`
	IngestedAt  time.Time `ch:"ingested_at" json:"ingested_at"`
	RequestID   string    `ch:"request_id" json:"request_id"`
	ServiceName string    `ch:"service_name" json:"service_name"`
	ClientIP    string    `ch:"client_ip" json:"client_ip"`
	Method      string    `ch:"method" json:"method"`
	Path        string    `ch:"path" json:"path"`
	StatusCode  uint16    `ch:"status_code" json:"status_code"`
	StatusGroup string    `ch:"status_group" json:"status_group"`
	LatencyMs   uint32    `ch:"latency_ms" json:"latency_ms"`
	IsError     uint8     `ch:"is_error" json:"is_error"`
	UserAgent   string    `ch:"user_agent" json:"user_agent"`
	RawMessage  string    `ch:"raw_message" json:"raw_message"`
}

type DLQMessage struct {
	FailedAt        time.Time              `json:"failed_at"`
	Reason          string                 `json:"reason"`
	OriginalTopic   string                 `json:"original_topic"`
	OriginalPayload map[string]interface{} `json:"original_payload"`
}

type RetryMessage struct {
	RetryCount    int       `json:"retry_count"`
	MaxRetry      int       `json:"max_retry"`
	FailedAt      time.Time `json:"failed_at"`
	LastError     string    `json:"last_error"`
	OriginalTopic string    `json:"original_topic"`
	Payload       Log       `json:"payload"`
}

type BackupLog struct {
	ID          int       `gorm:"primaryKey;column:id" json:"id"`
	EventTime   time.Time `gorm:"column:eventTime" json:"event_time"`
	IngestedAt  time.Time `gorm:"column:ingestedAt" json:"ingested_at"`
	RequestID   string    `gorm:"column:requestId" json:"request_id"`
	ServiceName string    `gorm:"column:serviceName" json:"service_name"`
	ClientIP    string    `gorm:"column:clientIp" json:"client_ip"`
	Method      string    `gorm:"column:method" json:"method"`
	Path        string    `gorm:"column:path" json:"path"`
	StatusCode  uint16    `gorm:"column:statusCode" json:"status_code"`
	StatusGroup string    `gorm:"column:statusGroup" json:"status_group"`
	LatencyMs   uint32    `gorm:"column:latencyMs" json:"latency_ms"`
	IsError     uint8     `gorm:"column:isError" json:"is_error"`
	UserAgent   string    `gorm:"column:userAgent" json:"user_agent"`
	RawMessage  string    `gorm:"column:rawMessage" json:"raw_message"`
	CreatedAt   time.Time `gorm:"column:createdAt" json:"created_at"`
}

func (BackupLog) TableName() string {
	return `"BackupLog"`
}
