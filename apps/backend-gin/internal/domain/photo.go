package domain

import "time"

// Photo is the domain model returned by the service layer.
// It is persistence-agnostic — the infrastructure layer maps between
// this type and its GORM-backed entity representation.
type Photo struct {
	ID             string
	Filename       string
	StoredFilename string
	URL            string
	Size           int64
	Tags           []string
	CreatedAt      time.Time
}

// UploadedFile represents a file received by the API layer that
// the domain service can persist. This mirrors the `Express.Multer.File`
// shape used by the NestJS reference implementation, so both backends
// share the same service contract.
type UploadedFile struct {
	OriginalName   string
	StoredFilename string
	Size           int64
}
