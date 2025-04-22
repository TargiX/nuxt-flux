terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.36"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "default" {
  name       = "${var.server_name}-sshkey"
  public_key = file(var.ssh_key_path)
}

resource "hcloud_server" "vm" {
  name        = var.server_name
  image       = var.image
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.default.id]

  user_data = <<-EOT
    #!/bin/bash
    set -e

    # Обновление системы
    apt update && apt upgrade -y

    # ─── Docker CE ─────────────────────────────────────────────────
    apt install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
      gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker

    # ─── UFW (Firewall) ─────────────────────────────────────────────
    apt install -y ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable

    # ─── Fail2ban ────────────────────────────────────────────────────
    apt install -y fail2ban
    systemctl enable fail2ban

    # ─── Unattended Upgrades ─────────────────────────────────────────
    apt install -y unattended-upgrades
    dpkg-reconfigure -f noninteractive unattended-upgrades
  EOT
}

output "ip_address" {
  value = hcloud_server.vm.ipv4_address
  description = "IP адрес нового сервера"
}
