package config

import (
	"log"
	"os"
	"sync"

	"github.com/spf13/viper"
)

// Env struct holds all the configuration settings
type Env struct {
	Port          string `mapstructure:"PORT"`
	DBUrl         string `mapstructure:"DATABASE_URL"`
	JwtSecret     string `mapstructure:"JWT_SECRET"`
	JwtExpire     int    `mapstructure:"JWT_EXPIRE"`
	ClickHouseURL string `mapstructure:"CLICKHOUSE_URL"`
	KafkaBrokers  string `mapstructure:"KAFKA_BROKERS"`
	KafkaUsername string `mapstructure:"KAFKA_USERNAME"`
	KafkaPassword string `mapstructure:"KAFKA_PASSWORD"`
	BatchSize     int    `mapstructure:"BATCH_SIZE"`
	FlushInterval int    `mapstructure:"FLUSH_INTERVAL"`
	PostgresUrl   string `mapstructure:"POSTGRES_URL"`
}

var (
	instance *Env
	once     sync.Once
)

func NewEnv(filename string, override bool) *Env {
	once.Do(func() {
		e := &Env{}
		viper.SetConfigFile(filename)

		if err := viper.ReadInConfig(); err != nil {
			log.Println("No .env file found, reading config from environment variables")
		}

		viper.AutomaticEnv()

		// Bind env để Unmarshal đọc được
		_ = viper.BindEnv("PORT")
		_ = viper.BindEnv("DATABASE_URL")
		_ = viper.BindEnv("JWT_SECRET")
		_ = viper.BindEnv("JWT_EXPIRE")
		_ = viper.BindEnv("CLICKHOUSE_URL")
		_ = viper.BindEnv("KAFKA_BROKERS")
		_ = viper.BindEnv("KAFKA_USERNAME")
		_ = viper.BindEnv("KAFKA_PASSWORD")
		_ = viper.BindEnv("BATCH_SIZE")
		_ = viper.BindEnv("FLUSH_INTERVAL")
		_ = viper.BindEnv("POSTGRES_URL")

		if err := viper.Unmarshal(e); err != nil {
			log.Fatal("Error loading config: ", err)
		}

		// Explicitly override with OS env variables if they exist (Viper AutomaticEnv ignores empty strings)
		if val, ok := os.LookupEnv("KAFKA_USERNAME"); ok {
			e.KafkaUsername = val
		}
		if val, ok := os.LookupEnv("KAFKA_PASSWORD"); ok {
			e.KafkaPassword = val
		}

		instance = e
	})

	return instance
}
