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

	// Debug: Print loaded DB_PASSWORD
	log.Printf("Loaded DB_PASSWORD: '%s'", cfg.Password)

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
	log.Println("🚀 Server running on port 8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("❌ Could not start server: %v", err)
	}
}
