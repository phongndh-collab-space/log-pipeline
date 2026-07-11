package routes

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/template/go-backend-gin-orm/repositories"
	"github.com/template/go-backend-gin-orm/services"
)

func LogRoutes(router *gin.RouterGroup, logService *services.LogService) {
	logGroup := router.Group("/logs")
	{
		logGroup.GET("", func(c *gin.Context) {
			limitStr := c.DefaultQuery("limit", "50")
			limit, err := strconv.Atoi(limitStr)
			if err != nil {
				limit = 50
			}

			pageStr := c.DefaultQuery("page", "1")
			page, err := strconv.Atoi(pageStr)
			if err != nil {
				page = 1
			}

			search := c.Query("search")
			status := c.Query("status")
			source := c.Query("source")

			var data interface{}
			var total int64

			if source == "postgres" {
				logs, totalCount, err := logService.GetBackupLogs(c.Request.Context(), page, limit, search, status)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch backup logs: " + err.Error()})
					return
				}
				data = logs
				total = totalCount
			} else {
				logs, totalCount, err := logService.GetRecentLogs(c.Request.Context(), page, limit, search, status)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs: " + err.Error()})
					return
				}
				data = logs
				total = totalCount
			}

			totalPages := int(total) / limit
			if int(total)%limit != 0 {
				totalPages++
			}

			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    data,
				"pagination": gin.H{
					"page":        page,
					"limit":       limit,
					"total":       total,
					"total_pages": totalPages,
				},
			})
		})

		logGroup.GET("/analytics", func(c *gin.Context) {
			source := c.Query("source")
			startStr := c.Query("start_time")
			endStr := c.Query("end_time")

			filter := repositories.AnalyticsFilter{Source: source}

			if startStr != "" {
				if t, err := time.Parse(time.RFC3339, startStr); err == nil {
					filter.StartTime = t
				}
			} else {
				filter.StartTime = time.Now().Add(-1 * time.Hour)
			}

			if endStr != "" {
				if t, err := time.Parse(time.RFC3339, endStr); err == nil {
					filter.EndTime = t
				}
			} else {
				filter.EndTime = time.Now()
			}

			analytics, err := logService.GetAnalytics(c.Request.Context(), filter)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics: " + err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    analytics,
			})
		})
	}
}
