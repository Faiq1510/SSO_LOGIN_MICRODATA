package utils

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// IsForeignKeyViolation checks if an error is a PostgreSQL foreign key violation (SQLSTATE 23503)
func IsForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23503"
	}
	return false
}
