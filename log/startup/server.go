package startup

import (
	"context"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/template/go-backend-gin-orm/config"
	"github.com/template/go-backend-gin-orm/docs"
	"github.com/template/go-backend-gin-orm/kafka"
	"github.com/template/go-backend-gin-orm/repositories"
	"github.com/template/go-backend-gin-orm/routes"
	"github.com/template/go-backend-gin-orm/services"
)

type Server struct {
	app *gin.Engine
}

func NewServer() *Server {
	// Initialize ClickHouse and Postgres
	chInstance := NewClickHouseDatabase()
	chInstance.MigrateDatabase()

	pgInstance := NewPostgresDatabase()

	// Initialize Kafka Producer and Consumer
	env := config.NewEnv(".env", true)
	producer := kafka.NewProducer(env)
	consumer := kafka.NewConsumer(env, chInstance, producer)
	
	// Start consumers in goroutines
	go consumer.StartMainConsumer(context.Background())
	go consumer.StartRetryConsumer(context.Background())

	app := gin.Default()
	app.Static("/uploads", "./uploads")

	// Initialize Repositories
	logRepo := repositories.NewLogRepository(chInstance.Conn, pgInstance.DB)

	// Initialize Services
	logService := services.NewLogService(logRepo)
	kafkaMonitorService := services.NewKafkaMonitorService(env)

	// Register Routes
	api := app.Group("/api")
	routes.LogRoutes(api, logService)
	routes.KafkaRoutes(api, kafkaMonitorService)

	// Swagger
	docs.SwaggerInfo.BasePath = "/api"
	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return &Server{app: app}
}

func (s *Server) Start() error {
	env := config.NewEnv(".env", true)
	log.Println("Starting server on port " + env.Port)
	return s.app.Run(fmt.Sprintf(":%s", env.Port))
}
