package photos

import (
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/photo-gallery/backend-gin/internal/domain"
	"github.com/photo-gallery/backend-gin/internal/infrastructure"
)

// maxUploadSize is the per-file upload cap (5 MB) enforced by the handler.
// It matches the NestJS MaxFileSizeValidator configuration.
const maxUploadSize int64 = 5 * 1024 * 1024

// allowedMimeTypes mirrors the NestJS FileTypeValidator regex
// `image/(jpeg|png|gif|webp)`.
var allowedMimeTypes = map[string]struct{}{
	"image/jpeg": {},
	"image/jpg":  {}, // some clients send this non-standard variant
	"image/png":  {},
	"image/gif":  {},
	"image/webp": {},
}

// Handler owns the Gin route handlers for /api/photos/*.
type Handler struct {
	service *domain.PhotoService
	storage *infrastructure.DiskStorage
}

// NewHandler builds a handler with its dependencies.
func NewHandler(service *domain.PhotoService, storage *infrastructure.DiskStorage) *Handler {
	return &Handler{service: service, storage: storage}
}

// Register attaches the photo endpoints to the given router group.
// Callers pass a group already rooted at "/api" so routes line up with
// the frontend proxy and the NestJS global prefix.
func (h *Handler) Register(rg *gin.RouterGroup) {
	group := rg.Group("/photos")
	group.POST("/upload", h.Upload)
	group.GET("", h.List)
	group.GET("/:id", h.GetByID)
	group.POST("/:id/thumbnail", h.Thumbnail)
	group.DELETE("/:id", h.Delete)
}

// Upload godoc
//
//	@Summary		Upload a new photo
//	@Description	Upload an image file (JPEG, PNG, GIF or WebP; max 5MB) with optional tags.
//	@Tags			photos
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file	formData	file	true	"Image file (JPEG/PNG/GIF/WebP, max 5MB)"
//	@Param			tags	formData	string	false	"Comma-separated list of tags"
//	@Success		201		{object}	PhotoResponse
//	@Failure		400		{object}	ErrorResponse
//	@Router			/photos/upload [post]
func (h *Handler) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		abortWithError(c, http.StatusBadRequest, "file is required")
		return
	}

	if fileHeader.Size > maxUploadSize {
		abortWithError(c, http.StatusBadRequest, "File size exceeds 5MB limit")
		return
	}

	mime := detectMime(fileHeader)
	if _, ok := allowedMimeTypes[mime]; !ok {
		abortWithError(c, http.StatusBadRequest, "Unsupported file type; expected image/jpeg|png|gif|webp")
		return
	}

	storedFilename, err := h.storage.Save(fileHeader)
	if err != nil {
		abortWithError(c, http.StatusInternalServerError, "failed to save uploaded file: "+err.Error())
		return
	}

	tags := parseTags(c.PostForm("tags"))

	photo, err := h.service.UploadPhoto(c.Request.Context(), domain.UploadedFile{
		OriginalName:   fileHeader.Filename,
		StoredFilename: storedFilename,
		Size:           fileHeader.Size,
	}, tags)
	if err != nil {
		abortWithError(c, http.StatusInternalServerError, "failed to persist photo: "+err.Error())
		return
	}

	c.JSON(http.StatusCreated, ToResponse(photo))
}

// List godoc
//
//	@Summary	List all photos
//	@Tags		photos
//	@Produce	json
//	@Success	200	{array}	PhotoResponse
//	@Router		/photos [get]
func (h *Handler) List(c *gin.Context) {
	photos, err := h.service.GetPhotos(c.Request.Context())
	if err != nil {
		abortWithError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, ToResponseList(photos))
}

// GetByID godoc
//
//	@Summary		Get a photo by ID
//	@Description	Returns the photo, or a JSON `null` body if not found (matches NestJS).
//	@Tags			photos
//	@Produce		json
//	@Param			id	path		string	true	"Photo identifier"
//	@Success		200	{object}	PhotoResponse
//	@Router			/photos/{id} [get]
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	photo, err := h.service.GetPhotoByID(c.Request.Context(), id)
	if err != nil {
		abortWithError(c, http.StatusInternalServerError, err.Error())
		return
	}
	if photo == nil {
		// Match NestJS: return 200 with JSON null, do NOT send 404.
		c.Data(http.StatusOK, "application/json; charset=utf-8", []byte("null"))
		return
	}
	c.JSON(http.StatusOK, ToResponse(*photo))
}

// Thumbnail godoc
//
//	@Summary		Generate a thumbnail URL for a photo
//	@Description	Returns a plain JSON string such as `"/uploads/abc.jpg?w=150&h=150"`.
//	@Tags			photos
//	@Produce		json
//	@Param			id		path	string	true	"Photo identifier"
//	@Param			width	query	int		false	"Thumbnail width in pixels"	default(150)
//	@Param			height	query	int		false	"Thumbnail height in pixels"	default(150)
//	@Success		201		{string}	string
//	@Failure		500		{object}	ErrorResponse
//	@Router			/photos/{id}/thumbnail [post]
func (h *Handler) Thumbnail(c *gin.Context) {
	id := c.Param("id")
	width := parseDimension(c.Query("width"), 150)
	height := parseDimension(c.Query("height"), 150)

	url, err := h.service.GenerateThumbnail(c.Request.Context(), id, width, height)
	if err != nil {
		// NestJS throws a raw Error here, which its default exception filter
		// maps to a 500. Preserve that behavior for contract parity.
		abortWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Respond with a plain JSON string — no wrapper — to match NestJS.
	c.JSON(http.StatusCreated, url)
}

// Delete godoc
//
//	@Summary	Delete a photo
//	@Tags		photos
//	@Produce	json
//	@Param		id	path		string	true	"Photo identifier"
//	@Success	200	{object}	DeleteResponse
//	@Router		/photos/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	ok, err := h.service.DeletePhoto(c.Request.Context(), id)
	if err != nil {
		abortWithError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, DeleteResponse{Success: ok})
}

// parseTags splits a comma-separated tags form value, trimming whitespace
// and discarding empty entries — matching the NestJS controller behavior.
func parseTags(raw string) []string {
	if raw == "" {
		return []string{}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

// parseDimension parses a query param as a positive int, falling back to
// the supplied default for empty/invalid values.
func parseDimension(raw string, def int) int {
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return def
	}
	return n
}

// detectMime returns the uploaded part's Content-Type header, lowercased.
// This is how multer's fileTypeValidator(fallbackToMimetype: true) behaves
// in the NestJS reference implementation.
func detectMime(fh *multipart.FileHeader) string {
	if fh == nil {
		return ""
	}
	if ct := fh.Header.Get("Content-Type"); ct != "" {
		return strings.ToLower(strings.TrimSpace(ct))
	}
	return ""
}
