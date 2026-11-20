package domain

import (
	"context"
	"errors"
	"fmt"
	"strconv"
)

// ErrPhotoNotFound is returned when a photo cannot be located by ID.
// The API layer decides how to translate this into an HTTP status.
var ErrPhotoNotFound = errors.New("photo not found")

// PhotoRepository describes persistence operations the service depends on.
// The infrastructure package provides a GORM-backed implementation.
type PhotoRepository interface {
	Create(ctx context.Context, p Photo) (Photo, error)
	FindAll(ctx context.Context) ([]Photo, error)
	FindByID(ctx context.Context, id uint64) (*Photo, error)
	Delete(ctx context.Context, id uint64) (bool, error)
}

// PhotoService contains all photo business logic. It is framework-agnostic
// and talks to storage only via PhotoRepository.
type PhotoService struct {
	repo PhotoRepository
}

// NewPhotoService wires a service with its repository dependency.
func NewPhotoService(repo PhotoRepository) *PhotoService {
	return &PhotoService{repo: repo}
}

// UploadPhoto persists a new photo using the already-stored file.
// The API layer is responsible for writing the file to disk and
// computing the stored filename before calling this method.
func (s *PhotoService) UploadPhoto(ctx context.Context, file UploadedFile, tags []string) (Photo, error) {
	if tags == nil {
		tags = []string{}
	}
	photo := Photo{
		Filename:       file.OriginalName,
		StoredFilename: file.StoredFilename,
		URL:            "/uploads/" + file.StoredFilename,
		Size:           file.Size,
		Tags:           tags,
	}
	return s.repo.Create(ctx, photo)
}

// GetPhotos returns all photos, newest first (ordering handled by repository).
func (s *PhotoService) GetPhotos(ctx context.Context) ([]Photo, error) {
	return s.repo.FindAll(ctx)
}

// GetPhotoByID returns a single photo or nil when absent.
// This mirrors the NestJS service contract which returns `Photo | null`.
func (s *PhotoService) GetPhotoByID(ctx context.Context, id string) (*Photo, error) {
	numericID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		// Invalid ID is treated as "not found" to match NestJS's forgiving behavior.
		return nil, nil
	}
	return s.repo.FindByID(ctx, numericID)
}

// GenerateThumbnail returns a thumbnail URL for the photo at id.
// It deliberately returns ErrPhotoNotFound when the photo does not exist;
// the API layer maps that to a 500 response to match NestJS.
func (s *PhotoService) GenerateThumbnail(ctx context.Context, id string, width, height int) (string, error) {
	if width <= 0 {
		width = 150
	}
	if height <= 0 {
		height = 150
	}
	photo, err := s.GetPhotoByID(ctx, id)
	if err != nil {
		return "", err
	}
	if photo == nil {
		return "", fmt.Errorf("%w: %s", ErrPhotoNotFound, id)
	}
	return fmt.Sprintf("/uploads/%s?w=%d&h=%d", photo.StoredFilename, width, height), nil
}

// DeletePhoto removes the photo row. It reports whether a row was removed.
func (s *PhotoService) DeletePhoto(ctx context.Context, id string) (bool, error) {
	numericID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return false, nil
	}
	return s.repo.Delete(ctx, numericID)
}
