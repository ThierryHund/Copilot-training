package photos

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// abortWithError writes the shared error envelope and halts the handler chain.
// The envelope format matches NestJS's default HttpException body:
//
//	{"statusCode": 400, "message": "...", "error": "Bad Request"}
func abortWithError(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, ErrorResponse{
		StatusCode: status,
		Message:    message,
		Error:      http.StatusText(status),
	})
}
