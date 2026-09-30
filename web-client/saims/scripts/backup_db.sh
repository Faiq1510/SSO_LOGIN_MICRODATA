#!/bin/bash

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-saims}
MINIO_URL=${MINIO_URL:-http://localhost:9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
MINIO_BUCKET=${MINIO_BUCKET:-backups}
BACKUP_DIR="/tmp/saims_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Starting database backup process..."

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform pg_dump
echo "Dumping database ${DB_NAME} to ${BACKUP_FILE}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Database backup failed!"
    exit 1
fi

echo "Database backup successful."

# Configure MinIO Client (mc)
echo "Configuring MinIO client..."
mc alias set myminio "$MINIO_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

# Ensure bucket exists
mc mb myminio/"$MINIO_BUCKET" --ignore-existing

# Upload to MinIO
echo "Uploading backup to MinIO bucket ${MINIO_BUCKET}..."
mc cp "$BACKUP_FILE" myminio/"$MINIO_BUCKET"/

if [ $? -ne 0 ]; then
    echo "Error: Upload to MinIO failed!"
    exit 1
fi

echo "Upload successful."

# Cleanup old backups (keep last 7 days)
echo "Cleaning up local backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

echo "Backup process completed successfully at $(date)."
