import Stripe from "npm:stripe";
import { logger } from "../services/logger.ts";
import { firewall } from "../services/firewallService.ts";
import { DatabaseSync as Database } from "node:sqlite";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock");

export async function handlePaymentRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...jsonHeaders, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "*" }});

  // Mock Success for E2E testing (Simulates Webhook success)
  if (req.method === "POST" && url.pathname === "/api/payments/mock-success") {
    try {
      const { macAddress, ipAddress, planHours = 1 } = await req.json();
      const db = new Database(DB_PATH);
      
      try {
        // Ensure device exists
        db.prepare("INSERT OR IGNORE INTO devices (mac_address, ip_address, last_seen) VALUES (?, ?, ?)").run(macAddress, ipAddress, new Date().toISOString());
      } catch (e: any) { throw new Error("Devices Insert Failed: " + e.message); }
      
      const sessionId = crypto.randomUUID();
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + planHours * 3600000); // Add hours
      
      try {
        db.prepare("INSERT INTO sessions (id, mac_address, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)").run(sessionId, macAddress, startTime.toISOString(), endTime.toISOString(), "active");
      } catch (e: any) { throw new Error("Sessions Insert Failed: " + e.message); }

      try {
        db.prepare("INSERT INTO payments (id, session_id, provider, amount, status) VALUES (?, ?, ?, ?, ?)").run(crypto.randomUUID(), sessionId, "mock", 10.0, "completed");
      } catch (e: any) { throw new Error("Payments Insert Failed: " + e.message); }
      
      db.close();

      logger.logEvent("firewall_update", ipAddress, macAddress, "Mock Payment Succeeded: Initiating firewall release");
      await firewall.allowDevice(macAddress, ipAddress || "192.168.1.1");
      
      return new Response(JSON.stringify({ success: true, sessionId }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
    }
  }

  // Checkout Initialization
  if (req.method === "POST" && url.pathname === "/api/payments/checkout") {
    try {
      const { planId, macAddress } = await req.json();
      logger.logEvent("system_start", null, macAddress, `Requested checkout for plan ${planId}`);
      return new Response(JSON.stringify({ success: true, clientSecret: "mock_cs_secret_12345", url: "https://checkout.stripe.com/pay/mock_url" }), { status: 200, headers: jsonHeaders });
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Checkout failed" }), { status: 500, headers: jsonHeaders });
    }
  }

  // Stripe WebHook
  if (req.method === "POST" && url.pathname === "/api/payments/stripe-webhook") {
    try {
      const payload = await req.text();
      const sig = req.headers.get("stripe-signature");
      logger.logEvent("system_start", null, null, `Stripe Webhook receipt. Signature: ${sig?.substring(0, 5)}...`);
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: jsonHeaders });
    } catch (err: unknown) {
      return new Response(JSON.stringify({ error: "Webhook validation failed" }), { status: 400, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: jsonHeaders });
}
