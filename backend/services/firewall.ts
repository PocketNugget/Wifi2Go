import { logger } from "./logger.ts";

export class FirewallService {
  private isLinux = Deno.build.os === "linux";
  private chainName = "WIFI2GO_AUTH";

  constructor() {
    // Attempt to initialize the firewall if on Linux
    if (this.isLinux) {
      this.initFirewall().catch(err => console.error("[Firewall] Init error:", err));
    }
  }

  /**
   * Initializes the iptables chains and rules.
   * This should be called once on system start.
   */
  async initFirewall() {
    console.log("[Firewall] Initializing real network chains...");
    try {
      // 1. Create the custom chain if it doesn't exist
      await this.runSudo(["iptables", "-N", this.chainName]);
      
      // 2. Insert the chain into the FORWARD path (if not already there)
      // This ensures all routed traffic passes through our auth check
      const checkCmd = await this.runSudo(["iptables", "-C", "FORWARD", "-j", this.chainName]);
      if (!checkCmd.success) {
        await this.runSudo(["iptables", "-I", "FORWARD", "1", "-j", this.chainName]);
      }

      console.log("[Firewall] Real network chains initialized successfully.");
    } catch (e) {
      console.error("[Firewall] Could not initialize iptables. Ensure you have sudo/NET_ADMIN permissions.", e);
    }
  }

  async grantInternetAccess(macAddress: string, ipAddress: string, _durationMinutes: number) {
    logger.logEvent("firewall_update", ipAddress, macAddress, `Granting real access`);
    
    if (!this.isLinux) {
      console.log(`[MOCK FIREWALL] Non-Linux environment: granted access to MAC ${macAddress}`);
      return true;
    }

    // Insert a rule to allow this MAC address in our custom chain
    const result = await this.runSudo([
      "iptables", "-I", this.chainName, "1", 
      "-m", "mac", "--mac-source", macAddress, 
      "-j", "ACCEPT"
    ]);

    if (result.success) {
      logger.logEvent("firewall_update", ipAddress, macAddress, "Device authorized in iptables");
      return true;
    } else {
      console.error(`[Firewall] Failed to grant access: ${result.stderr}`);
      return false;
    }
  }

  async revokeInternetAccess(macAddress: string) {
    logger.logEvent("firewall_update", null, macAddress, `Revoking real access`);
    
    if (!this.isLinux) {
      console.log(`[MOCK FIREWALL] Non-Linux environment: revoked access for MAC ${macAddress}`);
      return true;
    }

    // Remove the rule for this MAC address
    const result = await this.runSudo([
      "iptables", "-D", this.chainName, 
      "-m", "mac", "--mac-source", macAddress, 
      "-j", "ACCEPT"
    ]);

    return result.success;
  }

  // Alias for compatibility with other files
  async allowDevice(mac: string, ip: string): Promise<boolean> {
    return await this.grantInternetAccess(mac, ip, 0);
  }

  // Alias for compatibility with other files
  async blockDevice(mac: string, ip: string): Promise<boolean> {
    return await this.revokeInternetAccess(mac);
  }

  private async runSudo(args: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
    try {
      const command = new Deno.Command("sudo", {
        args: args,
        stdout: "piped",
        stderr: "piped",
      });
      const output = await command.output();
      return {
        success: output.success,
        stdout: new TextDecoder().decode(output.stdout),
        stderr: new TextDecoder().decode(output.stderr),
      };
    } catch (e) {
      return { success: false, stdout: "", stderr: String(e) };
    }
  }
}

export const firewall = new FirewallService();
