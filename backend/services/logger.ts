import { Database } from "jsr:@db/sqlite";

// Relative to the `/app` inside docker, or `./backend` locally.
// Our main process will run from `backend` directory.
const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

export type SecurityEventType = "auth_failure" | "spoof_attempt" | "network_error" | "firewall_update" | "system_start";

export class SecurityLogger {
  private db: Database | null = null;
  
  constructor() {
    try {
      this.db = new Database(DB_PATH);
    } catch (error) {
      console.error(`[SecurityLogger] Failed to open database at ${DB_PATH}:`, error);
    }
  }

  logEvent(eventType: SecurityEventType, ipAddress: string | null = null, macAddress: string | null = null, details: string = "") {
    if (!this.db) {
      console.warn(`[SecurityLogger] DB not initialized. Event missed: ${eventType}`);
      return;
    }

    try {
      const stmt = this.db.prepare("INSERT INTO security_logs (event_type, ip_address, mac_address, details) VALUES (?, ?, ?, ?)");
      stmt.run(eventType, ipAddress, macAddress, details);
      console.log(`[Security Log] ${eventType} - IP: ${ipAddress || "N/A"}, MAC: ${macAddress || "N/A"} - ${details}`);
    } catch (error) {
      console.error("[SecurityLogger] Failed to write security log to database:", error);
    }
  }

  close() {
    this.db?.close();
  }
}

export const logger = new SecurityLogger();
