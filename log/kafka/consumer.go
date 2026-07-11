package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/template/go-backend-gin-orm/config"
	"github.com/template/go-backend-gin-orm/model"
)

type LogInserter interface {
	BatchInsertLogs(ctx context.Context, logs []model.Log) error
	Ping(ctx context.Context) error
}

type Consumer struct {
	mainReader  *kafka.Reader
	retryReader *kafka.Reader
	producer    *Producer
	db          LogInserter
	batchSize   int
	flushInt    time.Duration
}

func NewConsumer(env *config.Env, db LogInserter, producer *Producer) *Consumer {
	brokers := strings.Split(env.KafkaBrokers, ",")
	if len(brokers) == 0 || brokers[0] == "" {
		brokers = []string{"localhost:9092"}
	}

	var dialer *kafka.Dialer
	if env.KafkaUsername != "" {
		dialer = &kafka.Dialer{
			SASLMechanism: plain.Mechanism{
				Username: env.KafkaUsername,
				Password: env.KafkaPassword,
			},
		}
	}

	mainReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		GroupID:  "go-log-service-group",
		Topic:    "raw-logs",
		Dialer:   dialer,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	retryReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		GroupID:  "go-log-service-retry-group",
		Topic:    "raw-logs-retry",
		Dialer:   dialer,
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})

	batchSize := env.BatchSize
	if batchSize <= 0 {
		batchSize = 500
	}

	flushInterval := env.FlushInterval
	if flushInterval <= 0 {
		flushInterval = 1
	}

	return &Consumer{
		mainReader:  mainReader,
		retryReader: retryReader,
		producer:    producer,
		db:          db,
		batchSize:   batchSize,
		flushInt:    time.Duration(flushInterval) * time.Second,
	}
}

func (c *Consumer) StartMainConsumer(ctx context.Context) {
	log.Println("✅ Kafka Main Consumer started listening on topic: raw-logs")

	var batch []kafka.Message
	ticker := time.NewTicker(c.flushInt)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if len(batch) > 0 {
				c.processMainBatch(ctx, batch)
				batch = nil
			}
		default:
			ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
			m, err := c.mainReader.FetchMessage(ctxTimeout)
			cancel()
			if err != nil {
				if err != context.DeadlineExceeded && err != context.Canceled {
					log.Printf("⚠️ Error fetching message from Kafka main topic: %v", err)
					time.Sleep(1 * time.Second)
				}
				continue
			}
			batch = append(batch, m)
			if len(batch) >= c.batchSize {
				c.processMainBatch(ctx, batch)
				batch = nil
				ticker.Reset(c.flushInt)
			}
		}
	}
}

func (c *Consumer) validateLog(logEntry model.Log) bool {
	if logEntry.EventTime.IsZero() {
		return false
	}
	if logEntry.Path == "" {
		return false
	}
	if logEntry.StatusCode < 100 || logEntry.StatusCode > 599 {
		return false
	}
	validMethods := map[string]bool{"GET": true, "POST": true, "PUT": true, "PATCH": true, "DELETE": true, "OPTIONS": true, "HEAD": true}
	if !validMethods[logEntry.Method] {
		return false
	}
	return true
}

func (c *Consumer) enrichLog(logEntry *model.Log) {
	if logEntry.StatusCode >= 200 && logEntry.StatusCode < 300 {
		logEntry.StatusGroup = "2xx"
	} else if logEntry.StatusCode >= 300 && logEntry.StatusCode < 400 {
		logEntry.StatusGroup = "3xx"
	} else if logEntry.StatusCode >= 400 && logEntry.StatusCode < 500 {
		logEntry.StatusGroup = "4xx"
		logEntry.IsError = 1
	} else if logEntry.StatusCode >= 500 {
		logEntry.StatusGroup = "5xx"
		logEntry.IsError = 1
	} else {
		logEntry.StatusGroup = "Unknown"
	}
	
	if logEntry.IngestedAt.IsZero() {
		logEntry.IngestedAt = time.Now()
	}
}

func (c *Consumer) insertWithPause(ctx context.Context, logs []model.Log) error {
	for {
		err := c.db.BatchInsertLogs(ctx, logs)
		if err == nil {
			return nil
		}

		if c.db.Ping(ctx) != nil {
			log.Println("⚠️ ClickHouse is down! Pausing Consumer...")

			ticker := time.NewTicker(5 * time.Second)

		waitLoop:
			for {
				select {
				case <-ctx.Done():
					ticker.Stop()
					return ctx.Err()
				case <-ticker.C:
					if c.db.Ping(ctx) == nil {
						log.Println("✅ ClickHouse is back online! Resuming Consumer...")
						break waitLoop
					}
				}
			}
			ticker.Stop()
			continue
		}

		return err
	}
}

func (c *Consumer) processMainBatch(ctx context.Context, batch []kafka.Message) {
	var validLogs []model.Log
	var invalidLogs []model.DLQMessage

	for _, m := range batch {
		var rawPayload map[string]interface{}
		var logEntry model.Log

		if err := json.Unmarshal(m.Value, &logEntry); err != nil {
			json.Unmarshal(m.Value, &rawPayload)
			invalidLogs = append(invalidLogs, model.DLQMessage{
				FailedAt:        time.Now(),
				Reason:          "json_parse_error",
				OriginalTopic:   "raw-logs",
				OriginalPayload: rawPayload,
			})
			continue
		}

		if !c.validateLog(logEntry) {
			json.Unmarshal(m.Value, &rawPayload)
			invalidLogs = append(invalidLogs, model.DLQMessage{
				FailedAt:        time.Now(),
				Reason:          "validation_failed",
				OriginalTopic:   "raw-logs",
				OriginalPayload: rawPayload,
			})
			continue
		}

		c.enrichLog(&logEntry)
		validLogs = append(validLogs, logEntry)
	}

	for _, invalidLog := range invalidLogs {
		c.producer.ProduceDLQ(ctx, invalidLog)
	}

	if len(validLogs) > 0 {
		err := c.insertWithPause(ctx, validLogs)
		if err != nil {
			log.Printf("❌ Batch Insert ClickHouse failed (data error), sending %d logs to retry topic", len(validLogs))
			for _, l := range validLogs {
				c.producer.ProduceRetry(ctx, model.RetryMessage{
					RetryCount:    1,
					MaxRetry:      3,
					FailedAt:      time.Now(),
					LastError:     err.Error(),
					OriginalTopic: "raw-logs",
					Payload:       l,
				})
			}
		} else {
			log.Printf("📥 Inserted %d valid logs to ClickHouse", len(validLogs))
		}
	}

	c.mainReader.CommitMessages(ctx, batch...)
}

func (c *Consumer) StartRetryConsumer(ctx context.Context) {
	log.Println("✅ Kafka Retry Consumer started listening on topic: raw-logs-retry")

	for {
		m, err := c.retryReader.FetchMessage(ctx)
		if err != nil {
			if err != context.Canceled {
				log.Printf("⚠️ Error fetching message from Kafka retry topic: %v", err)
				time.Sleep(1 * time.Second)
			}
			continue
		}

		var retryMsg model.RetryMessage
		err = json.Unmarshal(m.Value, &retryMsg)
		if err != nil {
			c.retryReader.CommitMessages(ctx, m)
			continue
		}

		if retryMsg.RetryCount > retryMsg.MaxRetry {
			var rawPayload map[string]interface{}
			b, _ := json.Marshal(retryMsg.Payload)
			json.Unmarshal(b, &rawPayload)
			
			c.producer.ProduceDLQ(ctx, model.DLQMessage{
				FailedAt:        time.Now(),
				Reason:          "max_retries_exceeded",
				OriginalTopic:   retryMsg.OriginalTopic,
				OriginalPayload: rawPayload,
			})
			c.retryReader.CommitMessages(ctx, m)
			continue
		}

		err = c.insertWithPause(ctx, []model.Log{retryMsg.Payload})
		if err != nil {
			log.Printf("❌ Retry Insert ClickHouse failed (attempt %d/%d)", retryMsg.RetryCount, retryMsg.MaxRetry)
			retryMsg.RetryCount++
			retryMsg.FailedAt = time.Now()
			retryMsg.LastError = err.Error()
			c.producer.ProduceRetry(ctx, retryMsg)
			c.retryReader.CommitMessages(ctx, m)
		} else {
			log.Printf("📥 Retry Inserted log to ClickHouse")
			c.retryReader.CommitMessages(ctx, m)
		}
	}
}
