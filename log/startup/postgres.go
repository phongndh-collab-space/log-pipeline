package startup

import (
	"log"

	"github.com/template/go-backend-gin-orm/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresDatabase struct {
	DB *gorm.DB
}

func NewPostgresDatabase() *PostgresDatabase {
	env := config.NewEnv(".env", true)

	dsn := env.PostgresUrl
	if dsn == "" {
		dsn = "postgresql://postgres:Sql000@@localhost:5435/log_tracing?sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to PostgreSQL: %v", err)
	}

	log.Println("✅ Connected to PostgreSQL successfully!")
	return &PostgresDatabase{DB: db}
}
