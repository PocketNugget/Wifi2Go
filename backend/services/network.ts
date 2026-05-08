export async function getIpFromMac(macAddress: string): Promise<string | null> {
  try {
    const cmd = new Deno.Command("arp", { args: ["-n"] });
    const output = await cmd.output();
    const stdout = new TextDecoder().decode(output.stdout);
    
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(macAddress.toLowerCase())) {
        // Standard Linux arp -n output: 10.0.0.50   ether   00:11:22:33:44:55   C   wlan0
        const parts = line.split(/\s+/).filter(p => p.trim().length > 0);
        if (parts.length >= 3 && parts[0].includes('.')) {
          return parts[0];
        }
      }
    }
  } catch (e) {
    console.error("[NetworkService] Failed to run arp:", e);
  }
  return null;
}

/**
 * Gets the MAC address for a given IP address by searching the ARP table.
 * Crucial for identifying devices in a real captive portal.
 */
export async function getMacFromIp(ipAddress: string): Promise<string | null> {
  try {
    // We use 'ip neighbor' as it is more modern and reliable on Pi 5 / Debian Bookworm
    const cmd = new Deno.Command("ip", { args: ["neighbor", "show", ipAddress] });
    const output = await cmd.output();
    const stdout = new TextDecoder().decode(output.stdout);
    
    // Output format: 10.0.0.50 dev wlan0 lladdr 00:11:22:33:44:55 REACHABLE
    const match = stdout.match(/lladdr\s+([0-9a-fA-F:]+)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }

    // Fallback to arp -n if ip neighbor fails or doesn't show it
    const arpCmd = new Deno.Command("arp", { args: ["-n", ipAddress] });
    const arpOutput = await arpCmd.output();
    const arpStdout = new TextDecoder().decode(arpOutput.stdout);
    const lines = arpStdout.split('\n');
    for (const line of lines) {
      if (line.includes(ipAddress)) {
        const match = line.match(/([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/);
        if (match) return match[0].toLowerCase();
      }
    }
  } catch (e) {
    console.error("[NetworkService] Failed to resolve MAC from IP:", e);
  }
  return null;
}
