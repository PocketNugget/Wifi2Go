import { DatabaseSync as Database } from "node:sqlite";

console.log("Testing DB directly...");
const db = new Database("./db_data/wifi2go.db");

try {
  db.prepare("INSERT OR IGNORE INTO devices (mac_address, ip_address, last_seen) VALUES (?, ?, ?)").run("TEST_MAC_2", "192.168.1.1", new Date().toISOString());
  console.log("Device insert successful.");
  
  db.prepare("INSERT INTO sessions (id, mac_address, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)").run("TEST_SESS_2", "TEST_MAC_2", new Date().toISOString(), new Date().toISOString(), "active");
  console.log("Session insert successful.");
  
  db.prepare("INSERT INTO payments (id, session_id, provider, amount, status) VALUES (?, ?, ?, ?, ?)").run("TEST_PAY_2", "TEST_SESS_2", "mock", 10.0, "completed");
  console.log("Payment insert successful.");
} catch (e: any) {
  console.error("DB Error:", e.message);
}

db.close();
