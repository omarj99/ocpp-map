package configs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type PostgresConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadPostgresConfig loads config from .env and environment variables.
func Config() PostgresConfig {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := PostgresConfig{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		SSLMode:  os.Getenv("DB_SSLMODE"),
	}

	if cfg.SSLMode == "" {
		cfg.SSLMode = "disable"
	}

	// Debug logging
	log.Printf("=== Configuration Debug ===")
	log.Printf("DB_HOST: '%s'", cfg.Host)
	log.Printf("DB_PORT: '%s'", cfg.Port)
	log.Printf("DB_USER: '%s'", cfg.User)
	log.Printf("DB_PASSWORD: '%s'", cfg.Password)
	log.Printf("DB_NAME: '%s'", cfg.DBName)
	log.Printf("DB_SSLMODE: '%s'", cfg.SSLMode)
	log.Printf("===========================")

	return cfg
}
