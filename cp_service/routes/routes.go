// routes/routes.go
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

		// Routes utilisateurs (protégées)
		cps := api.Group("/cps")
		cps.Use(middleware.AuthMiddleware()) // Appliquer le middleware d'authentification
		{
			cps.GET("", controller.GetCPS)
			cps.GET("/:id", controller.GetCP)
			cps.POST("", controller.CreateCP)
			cps.PUT("/:id", controller.UpdateCP)
			cps.DELETE("/:id", controller.DeleteCP)
		}
	}
}
