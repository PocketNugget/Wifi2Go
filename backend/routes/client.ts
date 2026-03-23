import { DatabaseSync as Database } from "node:sqlite";
import * as OTPAuth from "npm:otpauth";
import { generateToken } from "../utils/jwt.ts";
import { logger } from "../services/logger.ts";
import { firewall } from "../services/firewall.ts";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

export async function handleClientRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...jsonHeaders, "Access-Control-Allow-Headers": "Content-Type" }});
  }

  // Get status of the client's MAC address
  if (req.method === "GET" && url.pathname === "/api/client/status") {
    const macArg = url.searchParams.get("mac");
    if (!macArg) return new Response(JSON.stringify({ error: "MAC required" }), { status: 400, headers: jsonHeaders });

    try {
      const db = new Database(DB_PATH);
      const stmt = db.prepare("SELECT * FROM sessions WHERE mac_address = ? AND status = 'active' ORDER BY end_time DESC LIMIT 1");
      const session = stmt.get(macArg) as any;
      db.close();

      if (session) {
        const now = new Date().getTime();
        const end = new Date(session.end_time).getTime();
        if (now < end) {
           return new Response(JSON.stringify({ active: true, timeRemaining: Math.floor((end - now)/1000) }), { status: 200, headers: jsonHeaders });
        }
      }
      return new Response(JSON.stringify({ active: false, timeRemaining: 0 }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/client/config") {
    try {
      const db = new Database(DB_PATH);
      const setting = db.prepare("SELECT value FROM settings WHERE key = 'test_mode'").get() as any;
      db.close();
      return new Response(JSON.stringify({ testMode: setting?.value === 'true' }), { status: 200, headers: jsonHeaders });
    } catch(e) {
      return new Response(JSON.stringify({ testMode: true }), { status: 200, headers: jsonHeaders });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/client/register") {
    try {
      const { email, password } = await req.json();
      const db = new Database(DB_PATH);
      const exists = db.prepare("SELECT id FROM clients WHERE email = ?").get(email);
      if (exists) { db.close(); return new Response(JSON.stringify({ error: "Email taken" }), { status: 400, headers: jsonHeaders }); }
      
      const id = crypto.randomUUID();
      const secret = new OTPAuth.Secret().base32;
      const hashed = "hashed_" + password; // To be replaced by argon2
      
      db.prepare("INSERT INTO clients (id, email, password_hash, two_factor_secret, two_factor_enabled) VALUES (?, ?, ?, ?, 0)").run(id, email, hashed, secret);
      db.close();
      
      logger.logEvent("user_created" as any, null, null, `Client registered: ${email}`);
      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), label: "Wifi2Go", issuer: email });
      const qrCodeUrl = totp.toString();
      
      return new Response(JSON.stringify({ message: "Registered", secret, qrCodeUrl, id }), { status: 201, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/client/login") {
    try {
      const { email, password } = await req.json();
      const db = new Database(DB_PATH);
      const user = db.prepare("SELECT * FROM clients WHERE email = ?").get(email) as any;
      db.close();
      
      if (!user || user.password_hash !== "hashed_" + password) {
        logger.logEvent("auth_failure" as any, null, null, `Client login fail: ${email}`);
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: jsonHeaders });
      }

      if (user.two_factor_enabled) {
        return new Response(JSON.stringify({ requires2FA: true, id: user.id }), { status: 200, headers: jsonHeaders });
      }

      const token = await generateToken({ id: user.id, email: user.email, role: "client" });
      return new Response(JSON.stringify({ token }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/client/verify-totp") {
    try {
      const { id, totpToken } = await req.json();
      const db = new Database(DB_PATH);
      const user = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as any;
      db.close();
      
      if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: jsonHeaders });

      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.two_factor_secret), label: "Wifi2Go", issuer: user.email });
      const isValid = totp.validate({ token: totpToken, window: 1 }) !== null;
      if (!isValid) {
        logger.logEvent("auth_failure" as any, null, null, `Client TOTP fail: ${user.email}`);
        return new Response(JSON.stringify({ error: "Invalid code" }), { status: 401, headers: jsonHeaders });
      }

      const token = await generateToken({ id: user.id, email: user.email, role: "client" });
      return new Response(JSON.stringify({ token }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/client/enable-2fa") {
    try {
      const { id, totpToken } = await req.json();
      const db = new Database(DB_PATH);
      const user = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as any;
      
      if (!user) { db.close(); return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: jsonHeaders }); }

      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.two_factor_secret), label: "Wifi2Go", issuer: user.email });
      const isValid = totp.validate({ token: totpToken, window: 1 }) !== null;
      if (!isValid) {
        db.close(); return new Response(JSON.stringify({ error: "Invalid code" }), { status: 401, headers: jsonHeaders });
      }

      db.prepare("UPDATE clients SET two_factor_enabled = 1 WHERE id = ?").run(id);
      db.close();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    } catch(e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: jsonHeaders });
}
