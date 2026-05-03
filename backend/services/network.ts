export async function getIpFromMac(macAddress: string): Promise<string | null> {
  try {
    const cmd = new Deno.Command("arp", { args: ["-a"] });
    const output = await cmd.output();
    const stdout = new TextDecoder().decode(output.stdout);
    
    // arp -a output format varies, but usually contains the IP in parentheses and the MAC address
    // macOS: ? (192.168.1.100) at 00:11:22:33:44:55 on en0 ifscope [ether]
    // Linux: ? (192.168.1.100) at 00:11:22:33:44:55 [ether] on eth0
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(macAddress.toLowerCase())) {
        const match = line.match(/\((.*?)\)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  } catch (e) {
    console.error("[NetworkService] Failed to run arp:", e);
  }
  return null;
}
