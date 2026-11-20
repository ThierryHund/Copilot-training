package com.photogallery.backend;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application entry point for the Photo Gallery Spring Boot backend.
 *
 * <p>This backend is one of four interchangeable implementations (alongside
 * NestJS, FastAPI and Gin) sharing a common HTTP contract documented in
 * {@code docs/openapi.yaml}. The Angular frontend proxies {@code /api/*} and
 * {@code /uploads/*} to this service on port 42621 (override with the
 * {@code SPRING_BACKEND_PORT} environment variable).</p>
 */
@SpringBootApplication
@OpenAPIDefinition(
        info = @Info(
                title = "Photo Gallery API",
                version = "1.0.0",
                description = "Canonical HTTP API contract for the Photo Gallery backend. "
                        + "All alternative backend implementations (NestJS, FastAPI, Gin) "
                        + "must conform to this contract."
        ),
        servers = {
                @Server(url = "http://localhost:42621", description = "Local dev server")
        }
)
public class BackendSpringApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendSpringApplication.class, args);
    }
}
