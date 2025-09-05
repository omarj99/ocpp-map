package db

import (
	"context"
	"database/sql"
	"fmt"
	"gocrud/configs"
	"gocrud/models"
	"log"
	"strings"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

// DB est une instance globale de la base de données accessible partout
var DB *bun.DB

func NewDB(cfg configs.PostgresConfig) (*sql.DB, error) {
	// Vérifier si le port PostgreSQL est celui par défaut (5432)
	if cfg.Port != "5432" {
		log.Printf("⚠️ Warning: You are using port %s which is not the default PostgreSQL port (5432)", cfg.Port)
	}

	// Créer le DSN avec un timeout plus court pour éviter de longues attentes
	connOpts := fmt.Sprintf("connect_timeout=5&sslmode=%s", cfg.SSLMode)
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName, connOpts)

	log.Printf("Database connecting to %s:%s", cfg.Host, cfg.Port)

	// Créer un connecteur avec des options personnalisées					
	connector := pgdriver.NewConnector(
		pgdriver.WithDSN(dsn),
		pgdriver.WithTimeout(5*time.Second),
	)

	// Tenter de se connecter à la base de données spécifiée avec une boucle de retry
	var sqldb *sql.DB
	var err error
	maxRetries := 10
	retryInterval := 2 * time.Second
	for i := 0; i < maxRetries; i++ {
		sqldb = sql.OpenDB(connector)
		err = sqldb.Ping()
		if err == nil {
			break
		}
		log.Printf("Database not ready (attempt %d/%d): %v", i+1, maxRetries, err)
		sqldb.Close()
		time.Sleep(retryInterval)
	}
	if err != nil {
		log.Printf("❌ Database connection failed after %d attempts: %v", maxRetries, err)
	}

	// Si la connexion échoue
	if err != nil {
		// Déterminer le type d'erreur
		if strings.Contains(err.Error(), "i/o timeout") || strings.Contains(err.Error(), "connection refused") {
			log.Printf("❌ PostgreSQL server connection failed. Please check:")
			log.Printf("   1. Is PostgreSQL running on %s:%s?", cfg.Host, cfg.Port)
			log.Printf("   2. Are your firewall settings allowing connections?")
			log.Printf("   3. Is the PostgreSQL service listening on the correct port?")
			return nil, fmt.Errorf("PostgreSQL server connection failed: %w", err)
		} else if strings.Contains(err.Error(), "database") && strings.Contains(err.Error(), "does not exist") {
			log.Printf("Database '%s' does not exist. Attempting to create it...", cfg.DBName)
		} else {
			log.Printf("Database connection error: %v", err)
		}

		// Fermer la connexion échouée
		if sqldb != nil {
			sqldb.Close()
		}

		// Se connecter à la base postgres pour créer la nouvelle base
		adminConnOpts := fmt.Sprintf("connect_timeout=5&sslmode=%s", cfg.SSLMode)
		adminDSN := fmt.Sprintf("postgres://%s:%s@%s:%s/postgres?%s",
			cfg.User, cfg.Password, cfg.Host, cfg.Port, adminConnOpts)

		adminConnector := pgdriver.NewConnector(
			pgdriver.WithDSN(adminDSN),
			pgdriver.WithTimeout(5*time.Second),
		)
		adminDB := sql.OpenDB(adminConnector)

		// Vérifier que la connexion admin fonctionne
		if err := adminDB.Ping(); err != nil {
			if strings.Contains(err.Error(), "i/o timeout") || strings.Contains(err.Error(), "connection refused") {
				log.Printf("❌ Could not connect to PostgreSQL server. Make sure PostgreSQL is running on %s:%s", cfg.Host, cfg.Port)
			} else if strings.Contains(err.Error(), "password authentication failed") {
				log.Printf("❌ Authentication failed. Check your username and password")
			} else {
				log.Printf("❌ Admin database connection failed: %v", err)
			}
			return nil, fmt.Errorf("failed to connect to postgres admin database: %w", err)
		}

		defer func() {
			if adminDB != nil {
				adminDB.Close()
			}
		}()

		// Vérifier si la base de données existe déjà
		var exists bool
		checkQuery := "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)"
		err = adminDB.QueryRow(checkQuery, cfg.DBName).Scan(&exists)
		if err != nil {
			return nil, fmt.Errorf("failed to check if database exists: %w", err)
		}

		// Créer la base de données si elle n'existe pas
		if !exists {
			log.Printf("Database '%s' does not exist. Creating...", cfg.DBName)
			query := fmt.Sprintf("CREATE DATABASE %s", cfg.DBName)
			_, err = adminDB.Exec(query)
			if err != nil {
				return nil, fmt.Errorf("failed to create database: %w", err)
			}
			log.Printf("Database '%s' created successfully", cfg.DBName)
		} else {
			log.Printf("Database '%s' already exists", cfg.DBName)
		}

		// Tenter de se connecter à nouveau
		sqldb = sql.OpenDB(connector)
		err = sqldb.Ping()
		if err != nil {
			return nil, fmt.Errorf("failed to connect after database creation/verification: %w", err)
		}
	}

	sqldb.SetMaxOpenConns(10)
	sqldb.SetMaxIdleConns(10)

	// Assigner l'instance DB à la variable globale
	DB = bun.NewDB(sqldb, pgdialect.New())

	// Créer les tables si elles n'existent pas
	if err = createSchema(DB); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	log.Printf("Connected to database %s on %s:%s", cfg.DBName, cfg.Host, cfg.Port)
	return sqldb, nil
}

// createSchema crée les tables dans la base de données
func createSchema(db *bun.DB) error {
	// Créer un contexte pour la base de données
	ctx := context.Background()

	models := []interface{}{
		(*models.CP)(nil),
	}

	for _, model := range models {
		_, err := db.NewCreateTable().
			Model(model).
			IfNotExists().
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	log.Println("Database schema created successfully")
	return nil
}
