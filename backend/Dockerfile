# Native ARM64 (Apple Silicon / Raspberry Pi)
FROM denoland/deno:alpine

WORKDIR /app

# Ensure correct permissions
RUN chown -R deno:deno /app

# Switch to deno user for security
USER deno

COPY --chown=deno:deno . .

# Explicitly expose backend ports separately from frontend ones
EXPOSE 8000 8443

# Start the application using a Deno task
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]
