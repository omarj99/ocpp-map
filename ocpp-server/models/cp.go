package models

import (
	"time"

	"github.com/uptrace/bun"
)

type CP struct {
	bun.BaseModel `bun:"table:charging_point" json:\"-\"`
	ID            int64     `bun:\",pk,autoincrement\" json:\"id\"`
	Name          string    `json:\"name\"`
	Address       string    `json:\"address\"`
	FeedBack      string    `json:\"feedback\"`
	Ratings       int       `json:\"ratings\"`
	Status        string    `json:\"status\"`
	Power         string    `json:\"power\"`
	Connector     string    `json:\"connector\"`
	ConnectorID   int       `json:\"connector_id\"`
	Sessions      int       `json:\"sessions\"`
	Enabled       bool      `json:\"enabled\"`
	CreatedAt     time.Time `bun:\",nullzero,notnull,default:current_timestamp\" json:\"created_at\"`
	UpdatedAt     time.Time `bun:\",nullzero,notnull,default:current_timestamp\" json:\"updated_at\"`
}
