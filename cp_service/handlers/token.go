// utils/token/token.go
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
)

// Constants for token signing
const (
	AccessSecret  = "cpm"         // Your specified access secret
	RefreshSecret = "cpm-refresh" // Your specified refresh secret
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

// CreateToken génère des tokens JWT pour l'authentification
func CreateToken(userID int64) (*TokenDetails, error) {
	td := &TokenDetails{}
	td.AtExpires = time.Now().Add(time.Minute * 15).Unix()   // 15 minutes
	td.RtExpires = time.Now().Add(time.Hour * 24 * 7).Unix() // 7 jours

	// Créer le token d'accès
	atClaims := jwt.MapClaims{}
	atClaims["authorized"] = true
	atClaims["user_id"] = strconv.FormatInt(userID, 10)
	atClaims["exp"] = td.AtExpires
	at := jwt.NewWithClaims(jwt.SigningMethodHS256, atClaims)
	td.AccessToken, _ = at.SignedString([]byte(AccessSecret))

	// Créer le token de rafraîchissement
	rtClaims := jwt.MapClaims{}
	rtClaims["user_id"] = strconv.FormatInt(userID, 10)
	rtClaims["exp"] = td.RtExpires
	rt := jwt.NewWithClaims(jwt.SigningMethodHS256, rtClaims)
	td.RefreshToken, _ = rt.SignedString([]byte(RefreshSecret))

	return td, nil
}

// ExtractTokenMetadata extrait les métadonnées du token
func ExtractTokenMetadata(r *http.Request) (int64, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return 0, errors.New("authorization header is required")
	}

	// Format du token: "Bearer {token}"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return 0, errors.New("authorization header format must be Bearer {token}")
	}

	tokenString := parts[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Vérifier que l'algorithme utilisé est celui attendu
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(AccessSecret), nil
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

	return 0, errors.New("invalid token")
}

// ValidateRefreshToken valide un refresh token
func ValidateRefreshToken(tokenString string) (int64, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(RefreshSecret), nil
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

	return 0, errors.New("invalid refresh token")
}
