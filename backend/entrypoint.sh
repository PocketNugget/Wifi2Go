#!/bin/sh
# Ensure db_data directory exists with correct permissions
mkdir -p /app/db_data

# Run DB setup (idempotent - uses INSERT OR IGNORE)
deno run --allow-env --allow-read --allow-write --allow-ffi --unstable-ffi /app/db/setup.ts

# Start the main application
exec deno task start
