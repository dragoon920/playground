package routes

import (
	"database/sql"

	"github.com/user/playground/controllers"
	"github.com/user/playground/middleware"
	"github.com/user/playground/services"

	"github.com/gin-gonic/gin"
)

func Setup(db *sql.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(middleware.RequestLogger())

	health := controllers.NewHealthController(db)
	items := controllers.NewItemController(services.NewItemService(db))

	api := r.Group("/api")
	{
		api.GET("/health", health.Check)

		api.GET("/items", items.List)
		api.POST("/items", items.Create)
		api.PATCH("/items/:id", items.Update)
		api.DELETE("/items/:id", items.Delete)
	}

	return r
}
