variable "name" {
  description = "Globally unique, 3-24 chars."
  type        = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "terraform_principal_id" {
  description = "Object id of the identity running Terraform (gets Key Vault Secrets Officer)."
  type        = string
}

variable "purge_protection_enabled" {
  type    = bool
  default = false
}

variable "n8n_webhook_url" {
  description = "External n8n webhook URL, or \"none\" to disable notifications."
  type        = string
  default     = "none"
  sensitive   = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
