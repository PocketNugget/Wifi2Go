import Stripe from "npm:stripe";
import { logger } from "../services/logger.ts";

// Initialize Stripe (Mock key for development if not provided)
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock");

export async function handlePaymentRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jsonHeaders = { "Content-Type": "application/json" };
  
  // Checkout Initialization
  if (req.method === "POST" && url.pathname === "/api/payments/checkout") {
    try {
      const { planId, macAddress } = await req.json();
      
      // In production: Create actual Stripe/PayPal Checkout Session
      // session = await stripe.checkout.sessions.create({ ... })
      logger.logEvent("system_start", null, macAddress, `Requested checkout for plan ${planId}`);

      return new Response(JSON.stringify({ 
        success: true,
        clientSecret: "mock_cs_secret_12345",
        url: "https://checkout.stripe.com/pay/mock_url" 
      }), { status: 200, headers: jsonHeaders });
    } catch (_e: unknown) {
      return new Response(JSON.stringify({ error: "Checkout failed to initialize" }), { status: 500, headers: jsonHeaders });
    }
  }

  // Stripe WebHook
  if (req.method === "POST" && url.pathname === "/api/payments/stripe-webhook") {
    try {
      const payload = await req.text();
      const sig = req.headers.get("stripe-signature");
      
      // In production: verify signature using endpoint secret
      // const event = stripe.webhooks.constructEvent(payload, sig!, endpointSecret);
      
      // Assume Payment Intent Succeeded for Mock
      logger.logEvent("system_start", null, null, `Stripe Webhook triggered. Signature: ${sig?.substring(0, 10)}...`);
      
      // Here usually a cron / DB update happens: granting internet access via FirewallService.
      
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: jsonHeaders });
    } catch (err: unknown) {
      return new Response(JSON.stringify({ error: "Webhook Error validation failed" }), { status: 400, headers: jsonHeaders });
    }
  }

  // PayPal WebHook
  if (req.method === "POST" && url.pathname === "/api/payments/paypal-webhook") {
    logger.logEvent("system_start", null, null, "PayPal Webhook receiving event");
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: jsonHeaders });
  }

  return new Response("Payment Not Found", { status: 404 });
}
