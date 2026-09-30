// File ini digunakan untuk generate dan validate JWT token
// JWT Token digunakan untuk autentikasi dan otorisasi
// Maksudnya adalah sebagai token untuk login ke dalam website
// Token adalah semacam bukti kalau user sudah login
// Token ini berlaku selama 24 jam
// Setelah itu token akan kedaluwarsa dan user harus login kembali

package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func getSecretKey() []byte {
	return []byte(getEnv("JWT_SECRET", "supersecretkey"))
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// GenerateTokens generates access and refresh JWT tokens for a user
func GenerateTokens(userID string, role string, name string) (string, string, error) {
	// Access Token: 15 minutes
	accessExp := time.Now().Add(15 * time.Minute)
	accessClaims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"name":    name,
		"exp":     accessExp.Unix(),
		"iat":     time.Now().Unix(),
		"type":    "access",
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(getSecretKey())
	if err != nil {
		return "", "", err
	}

	// Refresh Token: 7 days
	refreshExp := time.Now().Add(7 * 24 * time.Hour)
	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     refreshExp.Unix(),
		"iat":     time.Now().Unix(),
		"type":    "refresh",
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(getSecretKey())
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// ValidateToken validates a JWT token and returns the claims if valid
func ValidateToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is what we expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return getSecretKey(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidClaims
}

// ValidateSSOToken validates an SSO JWT token using SSO_SHARED_SECRET
func ValidateSSOToken(tokenString string) (jwt.MapClaims, error) {
	secretKey := []byte(getEnv("SSO_SHARED_SECRET", "microdata_sso_shared_key_2026_saims"))

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidClaims
}

