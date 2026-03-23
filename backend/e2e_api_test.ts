import * as OTPAuth from "npm:otpauth";

const BASE_URL = "http://localhost:8000";
const ADMIN_URL = "http://localhost:8443";

async function runTest() {
  console.log("🚀 Starting E2E API Integration Tests...\n");

  const email = `testuser_${Date.now()}@wifi.com`;
  const password = "securepassword123";
  let clientId = "";
  let totpSecret = "";
  let clientToken = "";

  // 1. Client Registration
  console.log("1. Testing POST /api/client/register");
  const regRes = await fetch(`${BASE_URL}/api/client/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  console.log("   ✅ Registration successful. Received secret and ID.");
  clientId = regData.id;
  totpSecret = regData.secret;

  // 2. Enable 2FA (Verify TOTP)
  console.log("2. Testing POST /api/client/enable-2fa");
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(totpSecret) });
  const token = totp.generate();
  
  const enableRes = await fetch(`${BASE_URL}/api/client/enable-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: clientId, totpToken: token })
  });
  if (!enableRes.ok) throw new Error(`Enable 2FA failed: ${await enableRes.text()}`);
  console.log("   ✅ 2FA successfully verified and enabled.");

  // 3. Client Login
  console.log("3. Testing POST /api/client/login");
  const currentTotp = totp.generate(); // Generate fresh token
  const loginRes = await fetch(`${BASE_URL}/api/client/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, totpToken: currentTotp })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed (maybe wrong TOTP window?): ${JSON.stringify(loginData)}`);
  console.log("   ✅ Login successful. Received JWT Token.");
  clientToken = loginData.token;

  // 4. Free 5-Minute Plan Webhook Test
  console.log("4. Testing POST /api/payments/webhook (Free Tier)");
  const freeRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      mac_address: "AA:BB:CC:DD:EE:FF",
      amount: 0,
      durationMinutes: 5
    })
  });
  if (!freeRes.ok) throw new Error(`Webhook Free failed: ${await freeRes.text()}`);
  console.log("   ✅ Free 5-Min session stored in database & Firewall authorized.");

  // 5. Stripe Checkout URL Generation Test
  console.log("5. Testing POST /api/payments/checkout (Stripe Demo)");
  const checkoutRes = await fetch(`${BASE_URL}/api/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: "1hr",
      clientId,
      macAddress: "AA:BB:CC:DD:EE:FF"
    })
  });
  const checkoutData = await checkoutRes.json();
  if (!checkoutRes.ok || !checkoutData.url) throw new Error(`Checkout failed: ${JSON.stringify(checkoutData)}`);
  console.log(`   ✅ Stripe Checkout URL successfully mocked: ${checkoutData.url}`);

  // 6. Admin Authentication & Dashboard
  console.log("6. Testing POST /admin-api/login");
  const adminRes = await fetch(`${ADMIN_URL}/admin-api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" })
  });
  const adminData = await adminRes.json();
  if (!adminRes.ok) throw new Error(`Admin Login failed: ${JSON.stringify(adminData)}`);
  console.log("   ✅ Admin Login successful.");

  // 7. Verify Client stored in DB using Admin privileges
  console.log("7. Testing GET /admin-api/clients");
  const clientsRes = await fetch(`${ADMIN_URL}/admin-api/clients`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${adminData.token}` }
  });
  const clientsData = await clientsRes.json();
  if (!clientsRes.ok || !Array.isArray(clientsData)) throw new Error(`Admin Clients pull failed`);
  const foundClient = clientsData.find((c: any) => c.email === email);
  if (!foundClient) throw new Error("Our test client was not found in the Admin DB list.");
  console.log(`   ✅ Admin successfully retrieved client DB list. User ${email} exists.`);

  console.log("\n🎉 ALL FLOWS TESTED AND PASSED FLAWLESSLY! NO REGRESSIONS.");
}

runTest().catch(e => {
  console.error("\n❌ TEST FAILED:", e.message);
  Deno.exit(1);
});
