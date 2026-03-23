import Stripe from "npm:stripe";
import { logger } from "../services/logger.ts";
import { firewall } from "../services/firewall.ts";
import { DatabaseSync as Database } from "node:sqlite";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock");

export async function handlePaymentRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...jsonHeaders, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "*" }});

  if (req.method === "POST" && url.pathname === "/api/payments/webhook") {
    try {
      const { client_id, mac_address, amount, durationMinutes } = await req.json();
      const db = new Database(DB_PATH);
      const txId = crypto.randomUUID();
      db.prepare("INSERT INTO payments (id, client_id, provider, transaction_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)").run(
        txId, client_id, "mock_stripe", txId, amount, "completed"
      );
      
      db.prepare("INSERT OR REPLACE INTO devices (mac_address, client_id, ip_address, is_blocked) VALUES (?, ?, '192.168.mock.ip', 0)").run(mac_address, client_id);
      
      const start = new Date();
      const end = new Date(start.getTime() + durationMinutes * 60000);
      db.prepare("INSERT INTO sessions (id, mac_address, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)").run(
        crypto.randomUUID(), mac_address, start.toISOString(), end.toISOString(), "active"
      );
      db.close();
      
      await firewall.grantInternetAccess(mac_address, "192.168.mock.ip", durationMinutes);
      
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
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
