# Use Ubuntu-based Deno to guarantee GLIBC_2.38 compatibility for SQLite FFI on ARM64
FROM denoland/deno:ubuntu

WORKDIR /app

# Ensure correct permissions
RUN chown -R deno:deno /app

# Switch to deno user for security
USER deno

COPY --chown=deno:deno . .

# Explicitly expose backend ports separately from frontend ones
EXPOSE 8000 8443

CMD ["deno", "task", "start"]
