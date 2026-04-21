# Use Ubuntu-based Deno to guarantee GLIBC_2.38 compatibility for SQLite FFI on ARM64
FROM denoland/deno:ubuntu

WORKDIR /app

# Create db_data directory with correct permissions BEFORE switching to deno user
RUN mkdir -p /app/db_data && chown -R deno:deno /app

# Switch to deno user for security
USER deno

COPY --chown=deno:deno . .

# Make entrypoint executable (must be after COPY)
RUN chmod +x /app/entrypoint.sh

# Explicitly expose backend ports separately from frontend ones
EXPOSE 8000 8443

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
