import { Database } from "jsr:@db/sqlite";

// Absolute path to the database or relative to workspace. Deno will be mounted at /app
// Inside docker: /app/db_data/wifi2go.db
// Locally: ./db_data/wifi2go.db
const DB_DIR = "db_data";
const DB_PATH = `${DB_DIR}/wifi2go.db`;

try {
  Deno.mkdirSync(DB_DIR, { recursive: true });
} catch (_e) {
  // Directory already exists or permission issue
}

const db = new Database(DB_PATH);

console.log("Initialize schema for Wifi2Go...");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    mac_address TEXT PRIMARY KEY,
    ip_address TEXT,
    last_seen DATETIME,
    is_blocked BOOLEAN DEFAULT 0
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    mac_address TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(mac_address) REFERENCES devices(mac_address)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    transaction_id TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL, 
    ip_address TEXT,
    mac_address TEXT,
    details TEXT
  );
`);

console.log("Tables created successfully.");

// Default admin config for testing
const defaultAdminUser = "admin";
// In a real app we would use bcrypt or Web Crypto API for this.
const mockPasswordHash = "hashed_admin123";

try {
  const insertCmd = db.prepare("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)");
  insertCmd.run(defaultAdminUser, mockPasswordHash, "admin");
  console.log(\`Default admin created: \${defaultAdminUser}\`);
} catch (e: any) {
  if (e.message && e.message.includes("UNIQUE constraint failed")) {
    console.log(\`Default admin '\${defaultAdminUser}' already exists.\`);
  } else {
    throw e;
  }
}

db.close();
console.log(\`Database setup completed at: \${DB_PATH}\`);
