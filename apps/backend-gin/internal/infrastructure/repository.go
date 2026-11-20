package infrastructure

import (
	"context"
	"errors"
	"strconv"

	"gorm.io/gorm"

	"github.com/photo-gallery/backend-gin/internal/domain"
)

// GormPhotoRepository is the GORM-backed adapter implementing
// domain.PhotoRepository. Swapping storage engines only requires writing
// a new adapter against this interface — the domain layer is unaffected.
type GormPhotoRepository struct {
	db *gorm.DB
}

// NewGormPhotoRepository builds a repository backed by the given *gorm.DB.
func NewGormPhotoRepository(db *gorm.DB) *GormPhotoRepository {
	return &GormPhotoRepository{db: db}
}

// Create persists a new photo row and returns the domain representation.
func (r *GormPhotoRepository) Create(ctx context.Context, p domain.Photo) (domain.Photo, error) {
	entity := PhotoEntity{
		Filename:       p.Filename,
		StoredFilename: p.StoredFilename,
		URL:            p.URL,
		Size:           p.Size,
		Tags:           StringSlice(p.Tags),
	}
	if err := r.db.WithContext(ctx).Create(&entity).Error; err != nil {
		return domain.Photo{}, err
	}
	return entityToDomain(entity), nil
}

// FindAll returns every photo ordered by creation date (newest first),
// matching the NestJS service contract.
func (r *GormPhotoRepository) FindAll(ctx context.Context) ([]domain.Photo, error) {
	var rows []PhotoEntity
	if err := r.db.WithContext(ctx).
		Order("created_at DESC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]domain.Photo, 0, len(rows))
	for _, row := range rows {
		out = append(out, entityToDomain(row))
	}
	return out, nil
}

// FindByID returns the photo with the given ID, or (nil, nil) if absent.
func (r *GormPhotoRepository) FindByID(ctx context.Context, id uint64) (*domain.Photo, error) {
	var row PhotoEntity
	err := r.db.WithContext(ctx).First(&row, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	p := entityToDomain(row)
	return &p, nil
}

// Delete removes the row and reports whether anything was removed.
func (r *GormPhotoRepository) Delete(ctx context.Context, id uint64) (bool, error) {
	res := r.db.WithContext(ctx).Delete(&PhotoEntity{}, id)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func entityToDomain(e PhotoEntity) domain.Photo {
	return domain.Photo{
		ID:             strconv.FormatUint(e.ID, 10),
		Filename:       e.Filename,
		StoredFilename: e.StoredFilename,
		URL:            e.URL,
		Size:           e.Size,
		Tags:           []string(e.Tags),
		CreatedAt:      e.CreatedAt,
	}
}
