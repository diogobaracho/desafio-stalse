variable "subscription_id" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "location" {
  type    = string
  default = "brazilsouth"
}

variable "unique_suffix" {
  description = "Same value used in bootstrap (makes ACR/Key Vault names globally unique)."
  type        = string
}

variable "ci_principal_id" {
  description = "bootstrap output: github_identities[<env>].principal_id"
  type        = string
}

variable "humans_group_object_id" {
  description = "Entra ID group of engineers (optional)."
  type        = string
  default     = null
}

variable "n8n_webhook_url" {
  description = "External n8n webhook URL or \"none\" (stored in Key Vault)."
  type        = string
  default     = "none"
  sensitive   = true
}
