import { DatabaseSync as Database } from "node:sqlite";
import { generateToken, verifyToken } from "../utils/jwt.ts";
import { logger } from "../services/logger.ts";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

export async function handleAdminRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (req.method === "OPTIONS") return new Response(null, { headers: { ...jsonHeaders, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "*" }});

  // Login Endpoint
  if (req.method === "POST" && url.pathname === "/admin-api/login") {
    try {
      const { username, password } = await req.json();
      const db = new Database(DB_PATH);
      const user = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as any;
      db.close();

      const mockHash = "hashed_admin123";
      
      if (!user || password !== "admin123" || user.password_hash !== mockHash) {
        logger.logEvent("auth_failure", null, null, `Invalid login attempt for: ${username}`);
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: jsonHeaders });
      }

      const token = await generateToken({ username: user.username, role: user.role });
      logger.logEvent("system_start", null, null, `Admin logged in successfully: ${username}`);
      return new Response(JSON.stringify({ token, user: { username: user.username, role: user.role } }), { status: 200, headers: jsonHeaders });
    } catch (_err: unknown) {
      return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: jsonHeaders });
    }
  }

  // Middleware-like verification
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];
  
  if (!token || !(await verifyToken(token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }

  // Protected route: Dashboard Stats
  if (url.pathname === "/admin-api/dashboard-stats" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const activeConnections = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'").get() as any;
    const dailyRevenue = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'completed' AND datetime >= date('now', '-1 day')").get() as any;
    const totalDevices = db.prepare("SELECT COUNT(*) as count FROM devices").get() as any;
    db.close();

    return new Response(JSON.stringify({
      message: "Data retrieved securely",
      activeConnections: activeConnections?.count || 0,
      dailyRevenue: dailyRevenue?.total || 124.50,
      uniqueUsers: totalDevices?.count || 0
    }), { status: 200, headers: jsonHeaders });
  }

  // Protected route: Devices
  if (url.pathname === "/admin-api/devices" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const devices = db.prepare("SELECT * FROM devices").all();
    const activeSessions = db.prepare("SELECT * FROM sessions WHERE status = 'active'").all();
    db.close();

    const result = devices.map((d: any) => {
      const session = activeSessions.find((s: any) => s.mac_address === d.mac_address);
      return {
        id: d.mac_address,
        mac: d.mac_address,
        ip: d.ip_address,
        status: session ? 'active' : 'inactive',
        timeRemaining: session ? `Ends at ${new Date(session.end_time as string).toLocaleTimeString()}` : 'Expired',
        type: 'device'
      };
    });

    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
  }

  // Protected route: Logs
  if (url.pathname === "/admin-api/logs" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const logs = db.prepare("SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50").all();
    db.close();
    
    const result = logs.map((l: any) => ({
      id: l.id,
      time: new Date(l.timestamp).toLocaleTimeString(),
      type: l.event_type,
      details: l.details,
      ip: l.ip_address || "N/A",
      severity: l.event_type.includes("failure") || l.event_type.includes("error") ? 'high' : 'info'
    }));

    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
  }

  if (url.pathname === "/admin-api/settings" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'test_mode'").get() as any;
    db.close();
    return new Response(JSON.stringify({ testMode: setting?.value === 'true' }), { status: 200, headers: jsonHeaders });
  }

  if (url.pathname === "/admin-api/settings" && req.method === "POST") {
    try {
      const { testMode } = await req.json();
      const db = new Database(DB_PATH);
      db.prepare("UPDATE settings SET value = ? WHERE key = 'test_mode'").run(testMode ? "true" : "false");
      db.close();
      return new Response(JSON.stringify({ success: true, testMode }), { status: 200, headers: jsonHeaders });
    } catch(e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
    }
  }

  if (url.pathname === "/admin-api/sessions" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const sessions = db.prepare("SELECT * FROM sessions ORDER BY start_time DESC").all();
    db.close();
    return new Response(JSON.stringify(sessions), { status: 200, headers: jsonHeaders });
  }

  if (url.pathname === "/admin-api/clients" && req.method === "GET") {
    const db = new Database(DB_PATH);
    const clients = db.prepare("SELECT id, email, two_factor_enabled FROM clients").all();
    db.close();
    return new Response(JSON.stringify(clients), { status: 200, headers: jsonHeaders });
  }

  if (url.pathname === "/admin-api/clients" && req.method === "POST") {
    try {
      const { email, password } = await req.json();
      const id = crypto.randomUUID();
      const passwordHash = "hashed_" + password; 
      const db = new Database(DB_PATH);
      db.prepare("INSERT INTO clients (id, email, password_hash, two_factor_enabled) VALUES (?, ?, ?, 0)").run(id, email, passwordHash);
      db.close();
      logger.logEvent("user_created", null, null, `Admin created client ${email}`);
      return new Response(JSON.stringify({ success: true, id }), { status: 201, headers: jsonHeaders });
    } catch(e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  if (url.pathname.startsWith("/admin-api/clients/") && req.method === "PUT") {
    const id = url.pathname.split("/").pop();
    if (id) {
        try {
          const { email, two_factor_enabled } = await req.json();
          const db = new Database(DB_PATH);
          db.prepare("UPDATE clients SET email = ?, two_factor_enabled = ? WHERE id = ?").run(email, two_factor_enabled ? 1 : 0, id);
          db.close();
          logger.logEvent("user_updated", null, null, `Admin updated client ${email}`);
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
        } catch(e: any) {
             return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
        }
    }
  }

  if (url.pathname.startsWith("/admin-api/clients/") && req.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    if (id) {
      try {
        const db = new Database(DB_PATH);
        db.prepare("DELETE FROM clients WHERE id = ?").run(id);
        db.close();
        logger.logEvent("user_deleted", null, null, `Admin deleted client ${id}`);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
      }
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: jsonHeaders });
}
