package startup

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/template/go-backend-gin-orm/config"
	"github.com/template/go-backend-gin-orm/model"
)

type ClickHouseDatabase struct {
	Conn driver.Conn
}

func NewClickHouseDatabase() *ClickHouseDatabase {
	env := config.NewEnv(".env", true)

	dsn := env.ClickHouseURL
	if dsn == "" {
		dsn = "clickhouse://admin:admin123@localhost:9002/log_db"
	}

	options, err := clickhouse.ParseDSN(dsn)
	if err != nil {
		log.Fatalf("❌ Failed to parse ClickHouse DSN: %v", err)
	}

	conn, err := clickhouse.Open(options)
	if err != nil {
		log.Fatalf("❌ Failed to initialize ClickHouse connection: %v", err)
	}

	// Verify connection
	if err := conn.Ping(context.Background()); err != nil {
		if exception, ok := err.(*clickhouse.Exception); ok {
			log.Fatalf("❌ ClickHouse Exception [%d] %s \n%s", exception.Code, exception.Message, exception.StackTrace)
		}
		log.Fatalf("❌ Failed to ping ClickHouse: %v", err)
	}

	log.Println("✅ Connected to ClickHouse successfully!")
	return &ClickHouseDatabase{Conn: conn}
}

func (db *ClickHouseDatabase) MigrateDatabase() {
	ctx := context.Background()

	// 1. Create schema_migrations table if not exists
	err := db.Conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version String,
			applied_at DateTime DEFAULT now()
		) ENGINE = MergeTree()
		ORDER BY version
	`)
	if err != nil {
		log.Fatalf("Failed to create schema_migrations table: %v", err)
	}

	// 2. Read migration files from database/clickhouse/migrations
	migrationsDir := filepath.Join("database", "clickhouse", "migrations")
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Printf("Warning: ClickHouse migrations directory not found: %v", err)
		return
	}

	// Filter and sort .sql files
	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}
	sort.Strings(sqlFiles)

	// 3. For each file, check if already applied, and run if not
	for _, filename := range sqlFiles {
		version := strings.Split(filename, "_")[0]

		var count uint64
		err := db.Conn.QueryRow(ctx, "SELECT count() FROM schema_migrations WHERE version = ?", version).Scan(&count)
		if err != nil {
			log.Fatalf("Failed to check migration version %s: %v", version, err)
		}

		if count > 0 {
			// Already applied
			continue
		}

		// Read file content
		filePath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(filePath)
		if err != nil {
			log.Fatalf("Failed to read migration file %s: %v", filename, err)
		}

		log.Printf("Applying ClickHouse migration: %s...", filename)

		// Execute migration SQL
		err = db.Conn.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("Failed to execute migration %s: %v", filename, err)
		}

		// Record migration as applied
		err = db.Conn.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES (?)", version)
		if err != nil {
			log.Fatalf("Failed to record migration version %s: %v", version, err)
		}

		log.Printf("Migration %s applied successfully!", filename)
	}
}

func (db *ClickHouseDatabase) InsertLog(ctx context.Context, l model.Log) error {
	batch, err := db.Conn.PrepareBatch(ctx, "INSERT INTO logs (event_time, ingested_at, request_id, service_name, client_ip, method, path, status_code, status_group, latency_ms, is_error, user_agent, raw_message)")
	if err != nil {
		return err
	}
	err = batch.Append(
		l.EventTime,
		l.IngestedAt,
		l.RequestID,
		l.ServiceName,
		l.ClientIP,
		l.Method,
		l.Path,
		l.StatusCode,
		l.StatusGroup,
		l.LatencyMs,
		l.IsError,
		l.UserAgent,
		l.RawMessage,
	)
	if err != nil {
		return err
	}
	return batch.Send()
}

func (db *ClickHouseDatabase) BatchInsertLogs(ctx context.Context, logs []model.Log) error {
	if len(logs) == 0 {
		return nil
	}

	batch, err := db.Conn.PrepareBatch(ctx, "INSERT INTO logs (event_time, ingested_at, request_id, service_name, client_ip, method, path, status_code, status_group, latency_ms, is_error, user_agent, raw_message)")
	if err != nil {
		return err
	}
	for _, l := range logs {
		err = batch.Append(
			l.EventTime,
			l.IngestedAt,
			l.RequestID,
			l.ServiceName,
			l.ClientIP,
			l.Method,
			l.Path,
			l.StatusCode,
			l.StatusGroup,
			l.LatencyMs,
			l.IsError,
			l.UserAgent,
			l.RawMessage,
		)
		if err != nil {
			return err
		}
	}
	return batch.Send()
}

func (db *ClickHouseDatabase) Ping(ctx context.Context) error {
	return db.Conn.Ping(ctx)
}

