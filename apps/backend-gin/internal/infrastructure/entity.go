package infrastructure

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// StringSlice is a []string that persists as a JSON-encoded TEXT column.
// This mirrors NestJS/TypeORM's `simple-json` column type used by the
// reference implementation, so both backends store tags identically.
type StringSlice []string

// Value implements driver.Valuer for GORM persistence.
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// Scan implements sql.Scanner for GORM hydration.
func (s *StringSlice) Scan(src any) error {
	if src == nil {
		*s = StringSlice{}
		return nil
	}
	var raw []byte
	switch v := src.(type) {
	case []byte:
		raw = v
	case string:
		raw = []byte(v)
	default:
		return errors.New("StringSlice: unsupported scan type")
	}
	if len(raw) == 0 {
		*s = StringSlice{}
		return nil
	}
	var out []string
	if err := json.Unmarshal(raw, &out); err != nil {
		return err
	}
	*s = out
	return nil
}

// PhotoEntity is the GORM-backed persistence model.
// Column names are snake_case to match the NestJS/TypeORM schema, so the
// same SQLite file could in principle be read by either backend.
type PhotoEntity struct {
	ID             uint64      `gorm:"primaryKey;autoIncrement"`
	Filename       string      `gorm:"column:filename;not null"`
	StoredFilename string      `gorm:"column:stored_filename;uniqueIndex;not null"`
	URL            string      `gorm:"column:url;not null"`
	Size           int64       `gorm:"column:size;not null"`
	Tags           StringSlice `gorm:"column:tags;type:text;not null;default:'[]'"`
	CreatedAt      time.Time   `gorm:"column:created_at;autoCreateTime"`
}

// TableName pins the table to `photos` to match the NestJS entity.
func (PhotoEntity) TableName() string {
	return "photos"
}
