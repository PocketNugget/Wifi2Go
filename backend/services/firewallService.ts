import { logger } from "./logger.ts";

const OS_PLATFORM = Deno.build.os;

export class FirewallService {
  
  async allowDevice(mac: string, ip: string): Promise<boolean> {
    try {
      if (OS_PLATFORM === "darwin") {
        console.log(`[Firewall MOCK - macOS] Allowing device IP: ${ip}, MAC: ${mac}`);
        logger.logEvent("firewall_update", ip, mac, "Device allowed (Mocked for macOS)");
        return true;
      }
      
      // Real Linux iptables execution
      const cmd = new Deno.Command("sudo", {
        args: ["iptables", "-t", "mangle", "-I", "internet", "1", "-m", "mac", "--mac-source", mac, "-j", "RETURN"],
      });
      const { code } = await cmd.output();
      
      if (code === 0) {
        logger.logEvent("firewall_update", ip, mac, "Device allowed via iptables");
        return true;
      } else {
        logger.logEvent("network_error", ip, mac, `Failed to allow device. Exit code: ${code}`);
        return false;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.logEvent("network_error", ip, mac, `Firewall allow error: ${msg}`);
      return false;
    }
  }

  async blockDevice(mac: string, ip: string): Promise<boolean> {
    try {
      if (OS_PLATFORM === "darwin") {
        console.log(`[Firewall MOCK - macOS] Blocking device IP: ${ip}, MAC: ${mac}`);
        logger.logEvent("firewall_update", ip, mac, "Device blocked (Mocked for macOS)");
        return true;
      }
      
      // Delete the allow rule
      const cmd = new Deno.Command("sudo", {
        args: ["iptables", "-t", "mangle", "-D", "internet", "-m", "mac", "--mac-source", mac, "-j", "RETURN"],
      });
      const { code } = await cmd.output();
      
      if (code === 0) {
        logger.logEvent("firewall_update", ip, mac, "Device blocked via iptables");
        return true;
      } else {
        logger.logEvent("network_error", ip, mac, `Failed to block device. Exit code: ${code}`);
        return false;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.logEvent("network_error", ip, mac, `Firewall block error: ${msg}`);
      return false;
    }
  }
}

export const firewall = new FirewallService();
