package photos

import (
	"time"

	"github.com/photo-gallery/backend-gin/internal/domain"
)

// PhotoResponse is the JSON shape returned to the frontend.
// It MUST match the NestJS contract: string id, camelCase stored filename,
// ISO-8601 timestamps.
type PhotoResponse struct {
	ID             string    `json:"id" example:"1"`
	Filename       string    `json:"filename" example:"holiday.jpg"`
	StoredFilename string    `json:"storedFilename" example:"1700000000000-abcdef.jpg"`
	URL            string    `json:"url" example:"/uploads/1700000000000-abcdef.jpg"`
	Size           int64     `json:"size" example:"245678"`
	Tags           []string  `json:"tags"`
	CreatedAt      time.Time `json:"createdAt" format:"date-time"`
}

// DeleteResponse is the body returned by DELETE /api/photos/:id.
type DeleteResponse struct {
	Success bool `json:"success"`
}

// ErrorResponse is the shared error envelope used for 4xx/5xx responses.
// It matches NestJS's default HttpException body.
type ErrorResponse struct {
	StatusCode int    `json:"statusCode" example:"400"`
	Message    string `json:"message" example:"File size exceeds 5MB limit"`
	Error      string `json:"error" example:"Bad Request"`
}

// UploadPhotoRequest documents the multipart/form-data body of the upload
// endpoint. It exists only for OpenAPI generation — Gin reads the file and
// tags field directly off the request.
type UploadPhotoRequest struct {
	// File is the image file (JPEG, PNG, GIF, or WebP; max 5MB).
	File string `json:"file" form:"file" swaggertype:"string" format:"binary"`
	// Tags is a comma-separated list of tags.
	Tags string `json:"tags,omitempty" form:"tags" example:"vacation,beach,sunset"`
}

// ToResponse maps a domain.Photo into the API response shape. Tags are
// normalized to an empty slice so JSON output is always `[]`, never `null`.
func ToResponse(p domain.Photo) PhotoResponse {
	tags := p.Tags
	if tags == nil {
		tags = []string{}
	}
	return PhotoResponse{
		ID:             p.ID,
		Filename:       p.Filename,
		StoredFilename: p.StoredFilename,
		URL:            p.URL,
		Size:           p.Size,
		Tags:           tags,
		CreatedAt:      p.CreatedAt,
	}
}

// ToResponseList maps a slice of domain photos for list endpoints.
func ToResponseList(ps []domain.Photo) []PhotoResponse {
	out := make([]PhotoResponse, 0, len(ps))
	for _, p := range ps {
		out = append(out, ToResponse(p))
	}
	return out
}
