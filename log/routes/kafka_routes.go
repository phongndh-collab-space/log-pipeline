package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/template/go-backend-gin-orm/services"
)

func KafkaRoutes(router *gin.RouterGroup, kafkaMonitorService *services.KafkaMonitorService) {
	kafkaGroup := router.Group("/kafka")
	{
		kafkaGroup.GET("/monitor", func(c *gin.Context) {
			stats, err := kafkaMonitorService.GetMonitorStats()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch kafka stats: " + err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    stats,
			})
		})

		// GET /api/kafka/messages?topic=raw-logs&page=1&limit=20
		kafkaGroup.GET("/messages", func(c *gin.Context) {
			topic := c.DefaultQuery("topic", "raw-logs")

			pageStr := c.DefaultQuery("page", "1")
			page, err := strconv.Atoi(pageStr)
			if err != nil || page < 1 {
				page = 1
			}

			limitStr := c.DefaultQuery("limit", "20")
			limit, err := strconv.Atoi(limitStr)
			if err != nil || limit < 1 {
				limit = 20
			}

			result, err := kafkaMonitorService.GetTopicMessages(topic, page, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read kafka messages: " + err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    result,
			})
		})

		// GET /api/kafka/retry-stats
		kafkaGroup.GET("/retry-stats", func(c *gin.Context) {
			stats, err := kafkaMonitorService.GetRetryTopicStats()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get retry stats: " + err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    stats,
			})
		})
	}
}

