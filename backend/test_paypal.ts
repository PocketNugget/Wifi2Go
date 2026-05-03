import { paypal } from "./services/paypal.ts";

async function run() {
  console.log("Testing PayPal Create Order...");
  try {
    const order = await paypal.createOrder("2.00", "USD");
    console.log("Success! Order ID:", order.id);
  } catch (e) {
    console.error("Error creating order:", e);
  }
}

run();
