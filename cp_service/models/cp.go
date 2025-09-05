// models/user.go
package models

import (
	"time"

	"github.com/uptrace/bun"
)

type CP struct {
	bun.BaseModel `bun:"table:charging_point" json:"-"`

	ID        int64  `bun:",pk,autoincrement" json:"id"`
	Name      string `json:"name" binding:"required"`
	Address   string `json:"address" binding:"required"`
	FeedBack  string `json:"feedback" binding:"required"`
	Ratings   int    `json:"ratings" binding:"required"`
	Status    string `json:"status" binding:"required"`
	Power     string `json:"power" binding:"required"`
	Connector string `json:"connector" binding:"required"`
	Sessions  int    `json:"sessions" binding:"required"`
	Enabled   bool   `json:"enabled"`

	CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp" json:"updated_at"`
}
