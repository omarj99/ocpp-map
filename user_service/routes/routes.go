package routes

import (
	"gocrud/controller"
	"gocrud/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRoutes configure toutes les routes de l'application
func SetupRoutes(r *gin.Engine) {
	// Autoriser toutes les origines (CORS)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Groupe API
	api := r.Group("/api")
	{
		// Routes d'authentification
		auth := api.Group("/auth")
		{
			auth.POST("/register", controller.Register)
			auth.POST("/login", controller.Login)
			auth.POST("/refresh", controller.Refresh)
		}

		// Routes utilisateurs (protégées)
		users := api.Group("/users")
		users.Use(middleware.AuthMiddleware()) // Appliquer le middleware d'authentification
		{
			users.GET("", controller.GetUsers)
			users.GET("/:id", controller.GetUser)
			users.POST("", controller.CreateUser)
			users.PUT("/:id", controller.UpdateUser)
			users.DELETE("/:id", controller.DeleteUser)

		}
	}
}
