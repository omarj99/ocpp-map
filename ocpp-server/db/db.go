package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"ocpp-server/models"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

var DB *bun.DB

// Init initializes the database connection
func Init() error {
	// You can load these from environment variables or config files
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		if host == "" {
			host = "localhost"
		}
		if port == "" {
			port = "5432"
		}
		if user == "" {
			user = "postgres"
		}
		if password == "" {
			password = "postgres"
		}
		if dbname == "" {
			dbname = "cpm"
		}
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname)
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	DB = bun.NewDB(sqldb, pgdialect.New())

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := DB.PingContext(ctx); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	log.Println("Connected to database!")
	return nil
}

// UpdateChargerStatus updates the status of a charger in the database by charger ID
func UpdateChargerStatus(ctx context.Context, chargerID string, status string) error {
	_, err := DB.NewUpdate().
		Model(&models.CP{}).
		Set("status = ?", status).
		Where("id = ?", chargerID).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update charger status: %w", err)
	}
	return nil
}

// UpdateChargerStatusByName updates the status of a charger in the database by charger name
func UpdateChargerStatusByName(ctx context.Context, name string, status string) error {
	_, err := DB.NewUpdate().
		Model(&models.CP{}).
		Set("status = ?", status).
		Where("name = ?", name).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update charger status: %w", err)
	}
	return nil
}

// GetChargerByID fetches a charger by its ID
func GetChargerByID(ctx context.Context, chargerID string) (*models.CP, error) {
	charger := new(models.CP)
	err := DB.NewSelect().Model(charger).Where("id = ?", chargerID).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch charger: %w", err)
	}
	return charger, nil
}
