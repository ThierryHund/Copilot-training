package infrastructure

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// DiskStorage writes uploaded files to a local directory and produces
// unique stored filenames. It mirrors the `multer.diskStorage` behavior
// used by the NestJS reference implementation.
type DiskStorage struct {
	// Dir is the destination directory (e.g. "./uploads").
	Dir string
}

// NewDiskStorage returns a storage helper rooted at dir, creating the
// directory if it does not already exist.
func NewDiskStorage(dir string) (*DiskStorage, error) {
	if dir == "" {
		dir = "./uploads"
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create uploads dir %q: %w", dir, err)
	}
	return &DiskStorage{Dir: dir}, nil
}

// Save writes the uploaded file to disk under a unique name of the form
// "{unixMilli}-{rand}.{ext}" and returns that stored filename.
func (s *DiskStorage) Save(fh *multipart.FileHeader) (storedFilename string, err error) {
	src, err := fh.Open()
	if err != nil {
		return "", fmt.Errorf("open uploaded file: %w", err)
	}
	defer src.Close()

	stored := uniqueName(fh.Filename)
	destPath := filepath.Join(s.Dir, stored)

	dst, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("create dest file: %w", err)
	}
	defer func() {
		cerr := dst.Close()
		// If the copy succeeded but close failed, surface the close error.
		if err == nil && cerr != nil {
			err = cerr
		}
	}()

	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("copy uploaded file: %w", err)
	}

	return stored, nil
}

// uniqueName builds a "{unixMilli}-{hexRand}{ext}" filename. The extension
// is preserved (and lowercased) so static serving keeps the correct MIME type.
func uniqueName(original string) string {
	ext := strings.ToLower(filepath.Ext(original))
	var b [6]byte
	// rand.Read never returns a short read for crypto/rand; an error would
	// indicate a broken OS RNG, in which case the timestamp alone is a
	// reasonable fallback.
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%d%s", time.Now().UnixMilli(), ext)
	}
	return fmt.Sprintf("%d-%s%s", time.Now().UnixMilli(), hex.EncodeToString(b[:]), ext)
}
