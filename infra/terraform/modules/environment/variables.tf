variable "environment" {
  description = "dev or prod."
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "location" {
  type    = string
  default = "brazilsouth"
}

variable "resource_group_name" {
  description = "Created by infra/terraform/bootstrap."
  type        = string
}

variable "tenant_id" {
  type = string
}

variable "unique_suffix" {
  description = "Short lowercase alphanumeric suffix making ACR / Key Vault names globally unique."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]{3,6}$", var.unique_suffix))
    error_message = "unique_suffix must be 3-6 lowercase alphanumerics."
  }
}

variable "ci_principal_id" {
  description = "Object (principal) id of the GitHub OIDC identity for this environment (bootstrap output)."
  type        = string
}

variable "humans_group_object_id" {
  description = "Entra ID group for engineers. null = no human access assigned."
  type        = string
  default     = null
}

variable "humans_read_only" {
  description = "true in prod: Reader + AKS RBAC Reader only."
  type        = bool
}

variable "vnet_address_space" {
  type = string
}

variable "zones" {
  type    = list(string)
  default = null
}

variable "acr_sku" {
  type    = string
  default = "Basic"
}

variable "aks_sku_tier" {
  type    = string
  default = "Free"
}

variable "aks_node_vm_size" {
  type    = string
  default = "Standard_B2s_v2"
}

variable "aks_node_min_count" {
  type    = number
  default = 1
}

variable "aks_node_max_count" {
  type    = number
  default = 2
}

variable "postgres_sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}

variable "postgres_backup_retention_days" {
  type    = number
  default = 7
}

variable "postgres_high_availability" {
  type    = bool
  default = false
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "n8n_webhook_url" {
  type      = string
  default   = "none"
  sensitive = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
