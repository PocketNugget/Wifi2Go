import { DatabaseSync as Database } from "node:sqlite";
import { logger } from "./services/logger.ts";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";

// Helper to get active session
function hasActiveSession(macAddress: string): boolean {
  try {
    const db = new Database(DB_PATH);
    const stmt = db.prepare(`
      SELECT 1 FROM sessions 
      WHERE mac_address = ? 
      AND status = 'active' 
      AND end_time > ?
    `);
    const active = stmt.get(macAddress, new Date().toISOString());
    db.close();
    return !!active;
  } catch (error) {
    console.error("Database error checking session:", error);
    return false;
  }
}

export async function handleSimulatedInternet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const macAddress = url.searchParams.get("mac");
  const clientIp = req.headers.get("x-real-ip") || "127.0.0.1";

  // If no MAC is provided, we can't identify the device. Redirect to portal.
  if (!macAddress) {
    logger.logEvent("spoofing_attempt", clientIp, "UNKNOWN", "Attempted to browse without MAC identifier.");
    return Response.redirect("http://localhost/", 302);
  }

  const isAuthorized = hasActiveSession(macAddress);

  if (isAuthorized) {
    // Log successful access
    logger.logEvent("internet_access", clientIp, macAddress, `Device successfully accessed simulated website: ${url.pathname}`);
    
    // Serve the "Welcome to the Internet" mock page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The Internet</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { text-align: center; background: rgba(255, 255, 255, 0.05); padding: 4rem; border-radius: 2rem; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
          h1 { font-size: 3rem; margin-bottom: 1rem; color: #0071e3; }
          p { font-size: 1.2rem; color: #a1a1a6; }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🌍</div>
          <h1>Welcome to the Internet</h1>
          <p>Your network access is active and verified by the firewall.</p>
          <p style="font-size: 0.9rem; margin-top: 2rem; color: #666;">Simulated Internet Server (Port 3000)</p>
        </div>
      </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { "Content-Type": "text/html" }
    });
  } else {
    // Log blocked access
    logger.logEvent("internet_blocked", clientIp, macAddress, `Device intercepted and redirected to captive portal.`);
    
    // Redirect back to Captive Portal (Port 80)
    return Response.redirect(`http://localhost/?mac=${macAddress}`, 302);
  }
}
