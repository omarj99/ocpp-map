// controller/auth.go
package controller

import (
	"gocrud/db"
	"gocrud/models"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// TokenDetails contient les détails des tokens
type TokenDetails struct {
	AccessToken  string
	RefreshToken string
	AccessUuid   string
	RefreshUuid  string
	AtExpires    int64
	RtExpires    int64
}

// LoginRequest struct for login validation
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest struct for registration validation  
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	CarType  string `json:"car_type"`
}

// Register enregistre un nouvel utilisateur
func Register(c *gin.Context) {
	var req RegisterRequest

	// Valider les données d'entrée
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Vérifier si l'email existe déjà
	existingUser := new(models.User)
	err := db.DB.NewSelect().Model(existingUser).Where("email = ?", req.Email).Scan(c)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// Hasher le mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		CarType:   req.CarType,
		Role:      "user", // Default role for registration
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Insérer dans la base de données
	_, err = db.DB.NewInsert().Model(&user).Exec(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Ne pas renvoyer le mot de passe
	user.Password = ""

	c.JSON(http.StatusCreated, user)
}

// Login permet à un utilisateur de se connecter
func Login(c *gin.Context) {
	var req LoginRequest

	// Valider les données d'entrée
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Rechercher l'utilisateur par email
	user := new(models.User)
	err := db.DB.NewSelect().Model(user).Where("email = ?", req.Email).Scan(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Debug: Check if user was found and has password
	if user.Password == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Vérifier le mot de passe
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Update last login
	user.LastLogin = time.Now()
	_, err = db.DB.NewUpdate().Model(user).Column("last_login").Where("id = ?", user.ID).Exec(c)
	if err != nil {
		// Don't fail login if last_login update fails, just log it
		// log.Printf("Failed to update last login for user %d: %v", user.ID, err)
	}

	// Générer les tokens
	tokens, err := CreateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Ne pas renvoyer le mot de passe
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"user":         user,
		"access_token": tokens.AccessToken,
		"token":        tokens.AccessToken, // For compatibility with frontend expecting "token"
		"refresh_token": tokens.RefreshToken,
	})
}

// Refresh renouvelle le token d'accès
func Refresh(c *gin.Context) {
	var tokenData struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	// Valider les données d'entrée
	if err := c.ShouldBindJSON(&tokenData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Valider le refresh token
	token, err := jwt.Parse(tokenData.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		// Vérifier que l'algorithme utilisé est celui attendu
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.NewValidationError("unexpected signing method", jwt.ValidationErrorSignatureInvalid)
		}
		return []byte(os.Getenv("REFRESH_SECRET")), nil
	})

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Vérifier que le token est valide
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Extraire l'ID utilisateur
		userID, err := strconv.ParseInt(claims["user_id"].(string), 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing token"})
			return
		}

		// Générer de nouveaux tokens
		tokens, err := CreateToken(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  tokens.AccessToken,
			"token":         tokens.AccessToken, // For compatibility
			"refresh_token": tokens.RefreshToken,
		})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
	}
}

// CreateToken génère des tokens JWT pour l'authentification
func CreateToken(userID int64) (*TokenDetails, error) {
	td := &TokenDetails{}
	td.AtExpires = time.Now().Add(time.Hour * 24).Unix()     // 24 hours
	td.RtExpires = time.Now().Add(time.Hour * 24 * 7).Unix() // 7 jours

	// Créer le token d'accès
	atClaims := jwt.MapClaims{}
	atClaims["authorized"] = true
	atClaims["user_id"] = strconv.FormatInt(userID, 10)
	atClaims["exp"] = td.AtExpires
	at := jwt.NewWithClaims(jwt.SigningMethodHS256, atClaims)
	td.AccessToken, _ = at.SignedString([]byte(os.Getenv("ACCESS_SECRET")))

	// Créer le token de rafraîchissement
	rtClaims := jwt.MapClaims{}
	rtClaims["user_id"] = strconv.FormatInt(userID, 10)
	rtClaims["exp"] = td.RtExpires
	rt := jwt.NewWithClaims(jwt.SigningMethodHS256, rtClaims)
	td.RefreshToken, _ = rt.SignedString([]byte(os.Getenv("REFRESH_SECRET")))

	return td, nil
}

// ExtractTokenMetadata extrait les métadonnées du token
func ExtractTokenMetadata(r *http.Request) (int64, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return 0, jwt.NewValidationError("Authorization header is required", jwt.ValidationErrorMalformed)
	}

	// Format du token: "Bearer {token}"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return 0, jwt.NewValidationError("Authorization header format must be Bearer {token}", jwt.ValidationErrorMalformed)
	}

	tokenString := parts[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Vérifier que l'algorithme utilisé est celui attendu
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.NewValidationError("unexpected signing method", jwt.ValidationErrorSignatureInvalid)
		}
		return []byte(os.Getenv("ACCESS_SECRET")), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, err := strconv.ParseInt(claims["user_id"].(string), 10, 64)
		if err != nil {
			return 0, err
		}
		return userID, nil
	}

	return 0, jwt.NewValidationError("Invalid token", jwt.ValidationErrorMalformed)
}