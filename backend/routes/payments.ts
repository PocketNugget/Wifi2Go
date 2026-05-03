import Stripe from "npm:stripe";
import { logger } from "../services/logger.ts";
import { firewall } from "../services/firewall.ts";
import { DatabaseSync as Database } from "node:sqlite";
import { paypal } from "../services/paypal.ts";
import { getIpFromMac } from "../services/network.ts";

const DB_PATH = Deno.env.get("DB_PATH") || "./db_data/wifi2go.db";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock");

export const PLANS: Record<string, { price: number; durationMinutes: number }> = {
  "5min": { price: 0, durationMinutes: 5 },
  "1hr": { price: 2.00, durationMinutes: 60 },
  "24hr": { price: 8.00, durationMinutes: 1440 },
};

export async function handlePaymentRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...jsonHeaders, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "*" }});

  // FREE TIER FULFILLMENT
  if (req.method === "POST" && url.pathname === "/api/payments/free") {
    try {
      const { planId, macAddress, clientId } = await req.json();
      if (planId !== "5min") throw new Error("Invalid plan for free tier");
      
      const plan = PLANS[planId];
      if (!plan) throw new Error("Plan not found");

      await fulfillOrder(clientId, macAddress, plan.durationMinutes, plan.price, "free_tier", crypto.randomUUID());
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: jsonHeaders });
    }
  }

  // PAYPAL CREATE ORDER
  if (req.method === "POST" && url.pathname === "/api/payments/paypal/create-order") {
    try {
      const { planId } = await req.json();
      const plan = PLANS[planId];
      if (!plan) throw new Error("Invalid plan");

      const order = await paypal.createOrder(plan.price.toString(), "USD");
      return new Response(JSON.stringify({ orderId: order.id }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to create order" }), { status: 500, headers: jsonHeaders });
    }
  }

  // PAYPAL CAPTURE ORDER
  if (req.method === "POST" && url.pathname === "/api/payments/paypal/capture-order") {
    try {
      const { orderId, planId, macAddress, clientId } = await req.json();
      const plan = PLANS[planId];
      if (!plan) throw new Error("Invalid plan");

      const captureData = await paypal.captureOrder(orderId);
      
      if (captureData.status === "COMPLETED") {
        await fulfillOrder(clientId, macAddress, plan.durationMinutes, plan.price, "paypal", orderId);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
      } else {
        throw new Error("Payment not completed");
      }
    } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to capture order" }), { status: 500, headers: jsonHeaders });
    }
  }

  // Checkout Initialization (Stripe)
  if (req.method === "POST" && url.pathname === "/api/payments/checkout") {
    try {
      const { planId, macAddress, clientId } = await req.json();
      const plan = PLANS[planId];
      if (!plan) throw new Error("Invalid plan");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Wifi2Go - ${planId} Pass`,
              },
              unit_amount: Math.round(plan.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${url.origin}/payment-success`,
        cancel_url: `${url.origin}/pricing`,
        metadata: {
          clientId,
          macAddress,
          durationMinutes: plan.durationMinutes.toString(),
          planId,
          price: plan.price.toString()
        },
      });

      logger.logEvent("system_start", null, macAddress, `Created Stripe checkout session for ${planId}`);
      return new Response(JSON.stringify({ success: true, url: session.url }), { status: 200, headers: jsonHeaders });
    } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Checkout failed" }), { status: 500, headers: jsonHeaders });
    }
  }

  // Stripe WebHook
  if (req.method === "POST" && url.pathname === "/api/payments/stripe-webhook") {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.warn("Stripe Webhook Error: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500, headers: jsonHeaders });
    }

    try {
      const payload = await req.text();
      const sig = req.headers.get("stripe-signature");
      if (!sig) throw new Error("No signature");

      const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        if (metadata) {
          const { clientId, macAddress, durationMinutes, price } = metadata;
          await fulfillOrder(
            clientId, 
            macAddress, 
            parseInt(durationMinutes, 10), 
            parseFloat(price), 
            "stripe", 
            session.payment_intent as string || session.id
          );
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: jsonHeaders });
    } catch (err: any) {
      console.error("Stripe Webhook Error:", err.message);
      return new Response(JSON.stringify({ error: "Webhook validation failed" }), { status: 400, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: jsonHeaders });
}

async function fulfillOrder(clientId: string, macAddress: string, durationMinutes: number, amount: number, provider: string, transactionId: string) {
  const db = new Database(DB_PATH);
  const txId = crypto.randomUUID();
  
  db.prepare("INSERT INTO payments (id, client_id, provider, transaction_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    txId, clientId, provider, transactionId, amount, "completed"
  );
  
  let ipAddress = await getIpFromMac(macAddress);
  if (!ipAddress) {
    console.warn(`[Fulfillment] Could not resolve IP for MAC ${macAddress}, falling back to mock`);
    ipAddress = '192.168.mock.ip';
  }
  
  db.prepare("INSERT OR REPLACE INTO devices (mac_address, client_id, ip_address, is_blocked) VALUES (?, ?, ?, 0)").run(macAddress, clientId, ipAddress);
  
  const start = new Date();
  const end = new Date(start.getTime() + durationMinutes * 60000);
  db.prepare("INSERT INTO sessions (id, mac_address, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)").run(
    crypto.randomUUID(), macAddress, start.toISOString(), end.toISOString(), "active"
  );
  db.close();
  
  await firewall.grantInternetAccess(macAddress, ipAddress, durationMinutes);
}
