import { firewall as firewall1 } from "./services/firewall.ts";
import { firewall as firewall2 } from "./services/firewallService.ts";

async function test() {
  console.log("Testing firewall.ts (grant/revoke access)...");
  await firewall1.grantInternetAccess("AA:BB:CC:DD:EE:FF", "192.168.1.100", 60);
  await firewall1.revokeInternetAccess("AA:BB:CC:DD:EE:FF");

  console.log("\nTesting firewallService.ts (allow/block device)...");
  await firewall2.allowDevice("AA:BB:CC:DD:EE:FF", "192.168.1.100");
  await firewall2.blockDevice("AA:BB:CC:DD:EE:FF", "192.168.1.100");
  
  console.log("\nDone.");
}

test();
