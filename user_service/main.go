// main.go
package main

import (
	"gocrud/configs"
	"gocrud/db"
	"gocrud/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Charger la configuration
	cfg := configs.Config()

	// Initialiser la base de données
	sqlDB, err := db.NewDB(cfg)
	if err != nil {
		log.Fatalf("❌ Could not initialize database: %v", err)
	}
	defer sqlDB.Close()

	// Créer le routeur Gin
	r := gin.Default()

	// Initialiser les routes
	routes.SetupRoutes(r)

	// Démarrer le serveur
	log.Println("🚀 Server running on port 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("❌ Could not start server: %v", err)
	}
}
