const API_URL = "http://127.0.0.1:8000";
const ADMIN_URL = "http://127.0.0.1:8443";
const MAC = "E2:BB:A3:DD:12:44";

async function run() {
  console.log("1. Simulating Mock Payment Webhook...");
  const payRes = await fetch(`${API_URL}/api/payments/mock-success`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ macAddress: MAC, ipAddress: "192.168.1.10", planHours: 1 })
  });
  console.log("Payment Result:", await payRes.json());

  console.log("\n2. Checking Client Status...");
  const statusRes = await fetch(`${API_URL}/api/client/status?mac=${MAC}`);
  console.log("Client Status:", await statusRes.json());

  console.log("\n3. Admin Login...");
  const loginRes = await fetch(`${ADMIN_URL}/admin-api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" })
  });
  const { token, error } = await loginRes.json();
  
  if (error) {
    console.error("Login failed:", error);
    return;
  }
  console.log("Login Token Acquired (preview):", token.substring(0, 15) + "...");

  console.log("\n4. Fetching Active Devices (Admin Protected)...");
  const devRes = await fetch(`${ADMIN_URL}/admin-api/devices`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const devices = await devRes.json();
  console.log(`Found ${devices.length} devices. Target Device Status:`, devices.find((d:any) => d.mac === MAC)?.status);

  console.log("\n5. Fetching Security Logs (Admin Protected)...");
  const logRes = await fetch(`${ADMIN_URL}/admin-api/logs`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const logs = await logRes.json();
  console.log("Latest Log:", logs[0]?.details);

  console.log("\n✅ E2E Full Flow Completed Successfully!");
}

run();
