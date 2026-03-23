import { Database } from "jsr:@db/sqlite";
import { generateToken, verifyToken } from "../utils/jwt.ts";
import { logger } from "../services/logger.ts";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

export async function handleAdminRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Common Headers
  const jsonHeaders = { "Content-Type": "application/json" };

  // Login Endpoint
  if (req.method === "POST" && url.pathname === "/admin-api/login") {
    try {
      const { username, password } = await req.json();
      const db = new Database(DB_PATH);
      const stmt = db.prepare("SELECT * FROM admins WHERE username = ?");
      const user = stmt.get(username) as any;
      db.close();

      // In production, compare actual hashed password dynamically.
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

  // Middleware-like verification for the remainder of the routes
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];
  
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: jsonHeaders });
  }

  // Protected route examples
  if (url.pathname === "/admin-api/dashboard-stats" && req.method === "GET") {
    return new Response(JSON.stringify({
      message: "Data retrieved securely",
      activeConnections: 12,
      dailyRevenue: 154.50,
      uniqueUsers: 45
    }), { status: 200, headers: jsonHeaders });
  }

  return new Response("Not found", { status: 404 });
}
