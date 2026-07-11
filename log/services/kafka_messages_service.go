package services

import (
	"context"
	"encoding/json"
	"io"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
)

type KafkaMessage struct {
	Offset    int64     `json:"offset"`
	Partition int       `json:"partition"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	Time      time.Time `json:"time"`
}

type TopicMessagesResult struct {
	Topic       string         `json:"topic"`
	TotalCount  int64          `json:"total_count"`
	Messages    []KafkaMessage `json:"messages"`
	Page        int            `json:"page"`
	Limit       int            `json:"limit"`
	TotalPages  int            `json:"total_pages"`
}

type RetryTopicStats struct {
	TotalMessages  int64 `json:"total_messages"`
	UniqueMessages int64 `json:"unique_messages"`
}

func (s *KafkaMonitorService) newDialer() *kafka.Dialer {
	dialer := &kafka.Dialer{
		Timeout: 10 * time.Second,
	}
	if s.env.KafkaUsername != "" {
		dialer.SASLMechanism = plain.Mechanism{
			Username: s.env.KafkaUsername,
			Password: s.env.KafkaPassword,
		}
	}
	return dialer
}

func (s *KafkaMonitorService) getBroker() string {
	broker := s.env.KafkaBrokers
	if broker == "" {
		return "localhost:9092"
	}
	return strings.Split(broker, ",")[0]
}

// getTopicHighWatermarks returns the latest offset per partition (= total msgs)
func (s *KafkaMonitorService) getTopicHighWatermarks(topic string) (map[int]int64, error) {
	dialer := s.newDialer()
	conn, err := dialer.Dial("tcp", s.getBroker())
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions(topic)
	if err != nil {
		return nil, err
	}

	result := make(map[int]int64)
	for _, p := range partitions {
		pc, err := dialer.DialLeader(context.Background(), "tcp", s.getBroker(), topic, p.ID)
		if err != nil {
			continue
		}
		last, err := pc.ReadLastOffset()
		pc.Close()
		if err != nil {
			continue
		}
		result[p.ID] = last
	}
	return result, nil
}

// GetTopicMessages reads messages from a Kafka topic with offset-based pagination.
// It reads up to `limit` messages starting from a calculated offset from the end.
func (s *KafkaMonitorService) GetTopicMessages(topic string, page, limit int) (*TopicMessagesResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	watermarks, err := s.getTopicHighWatermarks(topic)
	if err != nil {
		return nil, err
	}

	// Sum total across all partitions
	var totalCount int64
	for _, hw := range watermarks {
		totalCount += hw
	}

	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	result := &TopicMessagesResult{
		Topic:      topic,
		TotalCount: totalCount,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
		Messages:   []KafkaMessage{},
	}

	if totalCount == 0 {
		return result, nil
	}

	// For simplicity: read from partition 0 only (most common single-partition setup)
	// Calculate the start offset for this page (reading latest first = descending)
	hw0 := watermarks[0]
	if hw0 == 0 {
		return result, nil
	}

	// Page 1 = most recent `limit` messages
	// Page 2 = next `limit` messages going backwards
	end := hw0 - int64((page-1)*limit)
	start := end - int64(limit)
	if start < 0 {
		start = 0
	}
	if end <= 0 {
		return result, nil
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{s.getBroker()},
		Topic:     topic,
		Partition: 0,
		Dialer:    s.newDialer(),
	})
	defer reader.Close()

	if err := reader.SetOffset(start); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var msgs []KafkaMessage
	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			if err == io.EOF || err == context.DeadlineExceeded {
				break
			}
			break
		}
		if msg.Offset >= end {
			break
		}
		km := KafkaMessage{
			Offset:    msg.Offset,
			Partition: msg.Partition,
			Key:       string(msg.Key),
			Value:     string(msg.Value),
			Time:      msg.Time,
		}
		msgs = append(msgs, km)
	}

	// Reverse so newest first
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	result.Messages = msgs
	return result, nil
}

// GetRetryTopicStats returns total and unique message counts for raw-logs-retry
func (s *KafkaMonitorService) GetRetryTopicStats() (*RetryTopicStats, error) {
	topic := "raw-logs-retry"
	watermarks, err := s.getTopicHighWatermarks(topic)
	if err != nil {
		return nil, err
	}

	var totalCount int64
	for _, hw := range watermarks {
		totalCount += hw
	}

	stats := &RetryTopicStats{TotalMessages: totalCount}

	if totalCount == 0 {
		return stats, nil
	}

	// Read all messages to count unique values (by value hash)
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{s.getBroker()},
		Topic:     topic,
		Partition: 0,
		Dialer:    s.newDialer(),
		MinBytes:  1,
		MaxBytes:  10e6,
	})
	defer reader.Close()

	if err := reader.SetOffset(0); err != nil {
		stats.UniqueMessages = totalCount
		return stats, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	type retryPayload struct {
		OriginalTopic   string                 `json:"original_topic"`
		OriginalPayload map[string]interface{} `json:"original_payload"`
	}

	seen := make(map[string]struct{})
	var hw int64 = watermarks[0]
	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			break
		}
		// Deduplicate by request_id in payload if available
		var p retryPayload
		if err := json.Unmarshal(msg.Value, &p); err == nil {
			if reqID, ok := p.OriginalPayload["request_id"]; ok {
				seen[reqID.(string)] = struct{}{}
			} else {
				seen[string(msg.Value)] = struct{}{}
			}
		} else {
			seen[string(msg.Value)] = struct{}{}
		}
		if msg.Offset >= hw-1 {
			break
		}
	}

	stats.UniqueMessages = int64(len(seen))
	return stats, nil
}
