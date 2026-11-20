package infrastructure

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DBConfig controls DB bootstrap. Only DSN is required in practice.
type DBConfig struct {
	// DSN is the SQLite connection string. Typically "./db/photos.sqlite".
	DSN string
	// Verbose toggles GORM info-level logging.
	Verbose bool
}

// InitDB opens a SQLite database (via the pure-Go glebarez driver, so no CGO
// is required) and auto-migrates the PhotoEntity schema.
func InitDB(cfg DBConfig) (*gorm.DB, error) {
	if cfg.DSN == "" {
		cfg.DSN = "./db/photos.sqlite"
	}

	// Make sure the containing directory exists so SQLite can create the file.
	if dir := filepath.Dir(cfg.DSN); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create db dir %q: %w", dir, err)
		}
	}

	logLevel := logger.Warn
	if cfg.Verbose {
		logLevel = logger.Info
	}

	db, err := gorm.Open(sqlite.Open(cfg.DSN), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("open sqlite %q: %w", cfg.DSN, err)
	}

	if err := db.AutoMigrate(&PhotoEntity{}); err != nil {
		return nil, fmt.Errorf("automigrate: %w", err)
	}

	return db, nil
}
