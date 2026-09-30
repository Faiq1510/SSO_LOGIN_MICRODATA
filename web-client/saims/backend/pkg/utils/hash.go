package utils

import (
	"errors"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// ValidatePasswordComplexity checks if the password meets the complexity requirements:
// - At least 8 characters long
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
func ValidatePasswordComplexity(password string) error {
	if len(password) < 8 {
		return errors.New("password harus minimal 8 karakter")
	}
	var hasUpper, hasLower, hasDigit bool
	for _, r := range password {
		if unicode.IsUpper(r) {
			hasUpper = true
		} else if unicode.IsLower(r) {
			hasLower = true
		} else if unicode.IsDigit(r) {
			hasDigit = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit {
		return errors.New("password harus mengandung minimal satu huruf besar, satu huruf kecil, dan satu angka")
	}
	return nil
}

// HashPassword generates a bcrypt hash of the given password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
} //Hash untuk password agar tidak mudah di retas oleh orang lain

// CheckPasswordHash compares a raw password with a hashed password
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
