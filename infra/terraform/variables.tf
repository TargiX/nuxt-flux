variable "hcloud_token" {
  type        = string
  description = "Hetzner Cloud API Token"
}

variable "ssh_key_path" {
  type        = string
  default     = "~/.ssh/dreamseed.pub"
  description = "Путь к public SSH‑ключу"
}

variable "server_name" {
  type    = string
  default = "dreamseed-mvp"
}

variable "location" {
  type    = string
  default = "nbg1" # Нюрнберг, выбери ближайший DC
}

variable "server_type" {
  type    = string
  default = "cx22"
}

variable "image" {
  type    = string
  default = "ubuntu-24.04"
}
