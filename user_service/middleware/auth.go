// middleware/auth.go
package middleware

import (
	"gocrud/controller"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware vérifie que l'utilisateur est authentifié
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := controller.ExtractTokenMetadata(c.Request)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Ajouter l'ID utilisateur au contexte pour une utilisation ultérieure
		c.Set("userID", userID)
		c.Next()
	}
}
