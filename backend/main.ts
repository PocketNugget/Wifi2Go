// Entry point for Deno backend

import { logger } from "./services/logger.ts";
import { firewall } from "./services/firewallService.ts";
import { handleAdminRoutes } from "./routes/admin.ts";
import { handlePaymentRoutes } from "./routes/payments.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");
const ADMIN_PORT = parseInt(Deno.env.get("ADMIN_PORT") || "8443");

logger.logEvent("system_start", "0.0.0.0", null, "Backend API initialized.");

async function handlePublicAPI(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Development endpoint to test Firewall Mock & Logger
  if (url.pathname === "/test-firewall") {
    await firewall.allowDevice("AA:BB:CC:DD:EE:FF", "192.168.1.100");
    return new Response(JSON.stringify({ status: "ok", message: "Firewall allow triggered. Check logs." }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Route any /api/payments requests
  if (url.pathname.startsWith("/api/payments")) {
    return handlePaymentRoutes(req);
  }

  return new Response(JSON.stringify({ status: "ok", message: "Wifi2Go Public API is running." }), {
    headers: { "content-type": "application/json" },
  });
}

async function handleAdminAPI(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname.startsWith("/admin-api")) {
    return handleAdminRoutes(req);
  }

  return new Response(JSON.stringify({ status: "ok", message: "Wifi2Go Admin Server is running." }), {
    headers: { "content-type": "application/json" },
  });
}

// Start Public API Server
Deno.serve({ port: PORT, onListen: ({ port }) => console.log(`Public API Server running on http://localhost:${port}/`) }, handlePublicAPI);

// Start Admin API Server
Deno.serve({ port: ADMIN_PORT, onListen: ({ port }) => console.log(`Admin API Server running on http://localhost:${port}/`) }, handleAdminAPI);
