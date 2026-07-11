package services

import (
	"strings"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/template/go-backend-gin-orm/config"
)

type KafkaMonitorService struct {
	env *config.Env
}

func NewKafkaMonitorService(env *config.Env) *KafkaMonitorService {
	return &KafkaMonitorService{env: env}
}

type TopicStats struct {
	Name         string `json:"name"`
	Partitions   int    `json:"partitions"`
	MessageCount int64  `json:"message_count"`
}

func (s *KafkaMonitorService) GetMonitorStats() ([]TopicStats, error) {
	broker := s.env.KafkaBrokers
	if broker == "" {
		broker = "localhost:9092"
	}
	
	var dialer *kafka.Dialer
	if s.env.KafkaUsername != "" {
		dialer = &kafka.Dialer{
			SASLMechanism: plain.Mechanism{
				Username: s.env.KafkaUsername,
				Password: s.env.KafkaPassword,
			},
		}
	} else {
		dialer = &kafka.Dialer{}
	}

	brokers := strings.Split(broker, ",")
	conn, err := dialer.Dial("tcp", brokers[0])
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions()
	if err != nil {
		return nil, err
	}

	topicMap := make(map[string]int)
	for _, p := range partitions {
		topicMap[p.Topic]++
	}

	targetTopics := []string{"raw-logs", "raw-logs-retry", "raw-logs-dlq"}
	var stats []TopicStats

	for _, t := range targetTopics {
		// Sum high watermarks across all partitions = total messages
		var msgCount int64
		wm, err := s.getTopicHighWatermarks(t)
		if err == nil {
			for _, hw := range wm {
				msgCount += hw
			}
		}
		stats = append(stats, TopicStats{
			Name:         t,
			Partitions:   topicMap[t],
			MessageCount: msgCount,
		})
	}

	return stats, nil
}
