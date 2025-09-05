package controller

import (
	"gocrud/db"
	"gocrud/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// CreateUser crée un nouvel utilisateur
func CreateUser(c *gin.Context) {
	var req models.UserCreateRequest

	// Valider les données d'entrée avec struct de validation
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Vérifier si l'email existe déjà
	var existingUser models.User
	err := db.DB.NewSelect().Model(&existingUser).Where("email = ?", req.Email).Scan(c)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user model from request
	user := models.User{
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		CarType:   req.CarType,
		Role:      req.Role,
		Status:    req.Status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Set default values if empty
	if user.Role == "" {
		user.Role = "user"
	}
	if user.Status == "" {
		user.Status = "active"
	}

	// Insérer dans la base de données
	_, err = db.DB.NewInsert().Model(&user).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't return the password in response
	user.Password = ""
	c.JSON(http.StatusCreated, user)
}

// GetUsers récupère tous les utilisateurs
func GetUsers(c *gin.Context) {
	var users []models.User

	// Récupérer de la base de données
	err := db.DB.NewSelect().Model(&users).Scan(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

// GetUser récupère un utilisateur par son ID
func GetUser(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Récupérer l'utilisateur
	user := new(models.User)
	err = db.DB.NewSelect().Model(user).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Don't return the password
	user.Password = ""
	c.JSON(http.StatusOK, user)
}

// UpdateUser met à jour un utilisateur
func UpdateUser(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Vérifier si l'utilisateur existe
	existingUser := new(models.User)
	err = db.DB.NewSelect().Model(existingUser).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Lier les nouvelles données avec struct de validation
	var req models.UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Mettre à jour uniquement les champs fournis
	if req.Name != "" {
		existingUser.Name = req.Name
	}
	if req.Email != "" {
		existingUser.Email = req.Email
	}
	if req.Password != "" {
		// Hash the new password before storing
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		existingUser.Password = string(hashedPassword)
	}
	if req.CarType != "" {
		existingUser.CarType = req.CarType
	}
	if req.Role != "" {
		existingUser.Role = req.Role
	}
	if req.Status != "" {
		existingUser.Status = req.Status
	}

	// Update timestamp
	existingUser.UpdatedAt = time.Now()

	// Mettre à jour l'utilisateur
	_, err = db.DB.NewUpdate().Model(existingUser).Where("id = ?", id).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't return the password
	existingUser.Password = ""
	c.JSON(http.StatusOK, existingUser)
}

// DeleteUser supprime un utilisateur
func DeleteUser(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Vérifier si l'utilisateur existe
	user := new(models.User)
	err = db.DB.NewSelect().Model(user).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Supprimer l'utilisateur
	_, err = db.DB.NewDelete().Model(user).Where("id = ?", id).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}