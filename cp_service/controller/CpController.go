package controller

import (
	"gocrud/db"
	"gocrud/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CreateCP crée un nouvel utilisateur
func CreateCP(c *gin.Context) {
	var CP models.CP

	// Valider les données d'entrée
	if err := c.ShouldBindJSON(&CP); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Insérer dans la base de données
	_, err := db.DB.NewInsert().Model(&CP).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, CP)
}

// GetCPs récupère tous les utilisateurs
func GetCPS(c *gin.Context) {
	var CPs []models.CP

	// Récupérer de la base de données
	err := db.DB.NewSelect().Model(&CPs).Scan(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, CPs)
}

// GetCP récupère un utilisateur par son ID
func GetCP(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Récupérer l'utilisateur
	CP := new(models.CP)
	err = db.DB.NewSelect().Model(CP).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CP not found"})
		return
	}

	c.JSON(http.StatusOK, CP)
}

// UpdateCP met à jour un utilisateur
func UpdateCP(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Vérifier si l'utilisateur existe
	CP := new(models.CP)
	err = db.DB.NewSelect().Model(CP).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CP not found"})
		return
	}

	// Lier les nouvelles données
	if err := c.ShouldBindJSON(CP); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// S'assurer que l'ID est correct
	CP.ID = id

	// Mettre à jour l'utilisateur
	_, err = db.DB.NewUpdate().Model(CP).Where("id = ?", id).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, CP)
}

// DeleteCP supprime un utilisateur
func DeleteCP(c *gin.Context) {
	// Convertir l'ID en entier
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Vérifier si l'utilisateur existe
	CP := new(models.CP)
	err = db.DB.NewSelect().Model(CP).Where("id = ?", id).Scan(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CP not found"})
		return
	}

	// Supprimer l'utilisateur
	_, err = db.DB.NewDelete().Model(CP).Where("id = ?", id).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CP deleted successfully"})
}
