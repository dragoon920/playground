package routes

import (
	"database/sql"
	"log"

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

	userService := services.NewUserService(db)
	if err := userService.EnsureAdminSeed(); err != nil {
		log.Printf("seed admin: %v", err)
	}

	health := controllers.NewHealthController(db)
	items := controllers.NewItemController(services.NewItemService(db))
	auth := controllers.NewAuthController(userService)
	users := controllers.NewUserController(userService)
	jobs := controllers.NewJobController(services.NewJobService(db))

	api := r.Group("/api")
	{
		api.GET("/health", health.Check)
		api.POST("/auth/login", auth.Login)

		// Playground items are public
		api.GET("/items", items.List)
		api.POST("/items", items.Create)
		api.PATCH("/items/:id", items.Update)
		api.DELETE("/items/:id", items.Delete)

		authed := api.Group("/")
		authed.Use(middleware.AuthRequired())
		{
			authed.GET("/auth/me", auth.Me)

			admin := authed.Group("/")
			admin.Use(middleware.AdminRequired())
			{
				admin.GET("/users", users.List)
				admin.POST("/users", users.Create)
				admin.DELETE("/users/:id", users.Delete)

				admin.GET("/jobs", jobs.List)
				admin.POST("/jobs", jobs.Create)
			}
		}
	}

	return r
}
