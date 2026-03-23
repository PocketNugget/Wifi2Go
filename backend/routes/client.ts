import { DatabaseSync as Database } from "node:sqlite";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

export function handleClientRoutes(req: Request): Response {
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

  return new Response("Not Found", { status: 404 });
}
