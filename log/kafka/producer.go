package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/template/go-backend-gin-orm/config"
	"github.com/template/go-backend-gin-orm/model"
)

type Producer struct {
	dlqWriter   *kafka.Writer
	retryWriter *kafka.Writer
}

func NewProducer(env *config.Env) *Producer {
	brokers := strings.Split(env.KafkaBrokers, ",")
	if len(brokers) == 0 || brokers[0] == "" {
		brokers = []string{"localhost:9092"}
	}

	dialer := &kafka.Dialer{
		SASLMechanism: plain.Mechanism{
			Username: env.KafkaUsername,
			Password: env.KafkaPassword,
		},
	}

	dlqWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    "raw-logs-dlq",
		Balancer: &kafka.LeastBytes{},
		Dialer:   dialer,
	})

	retryWriter := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    "raw-logs-retry",
		Balancer: &kafka.LeastBytes{},
		Dialer:   dialer,
	})

	return &Producer{
		dlqWriter:   dlqWriter,
		retryWriter: retryWriter,
	}
}

func (p *Producer) ProduceDLQ(ctx context.Context, msg model.DLQMessage) error {
	b, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	err = p.dlqWriter.WriteMessages(ctx, kafka.Message{
		Value: b,
	})
	if err != nil {
		log.Printf("❌ Failed to produce to DLQ: %v", err)
	}
	return err
}

func (p *Producer) ProduceRetry(ctx context.Context, msg model.RetryMessage) error {
	b, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	err = p.retryWriter.WriteMessages(ctx, kafka.Message{
		Value: b,
	})
	if err != nil {
		log.Printf("❌ Failed to produce to Retry topic: %v", err)
	}
	return err
}

func (p *Producer) Close() {
	if p.dlqWriter != nil {
		p.dlqWriter.Close()
	}
	if p.retryWriter != nil {
		p.retryWriter.Close()
	}
}
