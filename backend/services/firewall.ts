import { logger } from "./logger.ts";

export class FirewallService {
  private isLinux = Deno.build.os === "linux";

  async grantInternetAccess(macAddress: string, ipAddress: string, durationMinutes: number) {
    logger.logEvent("firewall_update", ipAddress, macAddress, `Granting access for ${durationMinutes} mins`);
    
    if (!this.isLinux) {
      console.log(`[MOCK FIREWALL] macOS/Windows environment: granted access to MAC ${macAddress} (IP: ${ipAddress})`);
      return;
    }

    try {
      const cmd = new Deno.Command("sudo", {
        args: ["iptables", "-I", "internet_access", "1", "-m", "mac", "--mac-source", macAddress, "-j", "ACCEPT"]
      });
      const output = await cmd.output();
      if (!output.success) {
        console.error(`[Firewall] Failed to execute iptables: ${new TextDecoder().decode(output.stderr)}`);
      }
    } catch (error) {
      console.error("[Firewall] Exception applying rules:", error);
    }
  }

  async revokeInternetAccess(macAddress: string) {
    logger.logEvent("firewall_update", null, macAddress, `Revoking access`);
    
    if (!this.isLinux) {
      console.log(`[MOCK FIREWALL] macOS/Windows environment: revoked access for MAC ${macAddress}`);
      return;
    }

    try {
      const cmd = new Deno.Command("sudo", {
        args: ["iptables", "-D", "internet_access", "-m", "mac", "--mac-source", macAddress, "-j", "ACCEPT"]
      });
      await cmd.output();
    } catch (error) {
      console.error("[Firewall] Exception revoking rules:", error);
    }
  }
}

export const firewall = new FirewallService();
