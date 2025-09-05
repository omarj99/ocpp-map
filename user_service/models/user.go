// models/user.go
package models

import (
	"time"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users" json:"-"`
	ID            int64     `bun:",pk,autoincrement" json:"id"`
	Name          string    `bun:"name" json:"name"`
	Email         string    `bun:"email" json:"email"`
	Password      string    `bun:"password" json:"password,omitempty"` // omitempty prevents returning in responses
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	CarType   string    `bun:"car_type" json:"car_type"`           // Added bun tag for database column
	Role      string    `bun:"role" json:"role"`
	Status    string    `bun:"status" json:"status"`
	LastLogin time.Time `bun:"last_login" json:"last_login"`

	// Not stored in users table, for API response only
	Transactions []Transaction `json:"transactions,omitempty" bun:"-"`
}

// UserCreateRequest - separate struct for creation validation
type UserCreateRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	CarType  string `json:"car_type"`
	Role     string `json:"role" binding:"oneof=admin operator user"`
	Status   string `json:"status"`
}

// UserUpdateRequest - separate struct for update validation
type UserUpdateRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email" binding:"omitempty,email"`
	Password string `json:"password" binding:"omitempty,min=6"`
	CarType  string `json:"car_type"`
	Role     string `json:"role" binding:"omitempty,oneof=admin operator user"`
	Status   string `json:"status"`
}

// Transaction struct for user transaction history
type Transaction struct {
	ID     int64     `json:"id"`
	Date   time.Time `json:"date"`
	Amount float64   `json:"amount"`
	Status string    `json:"status"`
}