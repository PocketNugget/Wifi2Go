#!/bin/bash

# Wifi2Go - Raspberry Pi 5 Production Setup Script
# This script configures the OS-level networking for the real Captive Portal.

set -e

echo "📡 Starting Wifi2Go Network Setup for Raspberry Pi 5..."

# 1. Update and Install Dependencies
echo "📦 Installing networking tools..."
sudo apt update
sudo apt install -y nftables iptables-persistent network-manager

# 2. Enable IPv4 Forwarding
echo "🌐 Enabling IP Forwarding..."
if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
fi

# 3. Setup WiFi Hotspot using NetworkManager
# We use NetworkManager because it's the standard on Pi OS Bookworm (Pi 5)
echo "📶 Configuring WiFi Hotspot (SSID: Wifi2Go)..."
# Delete existing hotspot if it exists
sudo nmcli connection delete Wifi2Go || true

# Create the hotspot
# Note: replace 'wlan0' if your interface has a different name
sudo nmcli device wifi hotspot \
    ifname wlan0 \
    con-name Wifi2Go \
    ssid Wifi2Go \
    password "wifi2go-pass"

# Set a static IP for the hotspot gateway
sudo nmcli connection modify Wifi2Go ipv4.addresses 10.42.0.1/24 ipv4.method shared

# 4. Initialize Firewall Rules
echo "🔥 Configuring Firewall (iptables)..."

# Create the custom authentication chain used by the Backend
sudo iptables -N WIFI2GO_AUTH || true

# Ensure the FORWARD chain sends traffic to our auth chain first
if ! sudo iptables -C FORWARD -j WIFI2GO_AUTH 2>/dev/null; then
    sudo iptables -I FORWARD 1 -j WIFI2GO_AUTH
fi

# Set Default FORWARD policy to DROP (Unauthorized devices can't browse)
sudo iptables -P FORWARD DROP

# Allow DNS and DHCP traffic to the Pi (so they can reach the portal)
sudo iptables -I INPUT -i wlan0 -p udp --dport 67:68 -j ACCEPT
sudo iptables -I INPUT -i wlan0 -p udp --dport 53 -j ACCEPT
sudo iptables -I INPUT -i wlan0 -p tcp --dport 80 -j ACCEPT

# Configure NAT (Masquerade) to share internet from eth0 to wlan0
echo "🌍 Setting up NAT (Masquerade)..."
if ! sudo iptables -t nat -C POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null; then
    sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
fi

# Save iptables rules
echo "💾 Saving firewall rules..."
sudo sh -c "iptables-save > /etc/iptables/rules.v4"

echo "✅ Network setup complete!"
echo "🚀 Now you can run: docker-compose up -d"
echo "📱 Clients connecting to 'Wifi2Go' will be redirected to the portal."
