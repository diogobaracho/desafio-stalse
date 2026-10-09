variable "name" {
  type = string
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

variable "kubernetes_version" {
  description = "null = AKS default version."
  type        = string
  default     = null
}

variable "sku_tier" {
  description = "Free (dev) or Standard (prod, financially-backed SLA)."
  type        = string
  default     = "Free"
}

variable "node_vm_size" {
  type    = string
  default = "Standard_B2s_v2"
}

variable "node_min_count" {
  type    = number
  default = 1
}

variable "node_max_count" {
  type    = number
  default = 2
}

variable "zones" {
  type    = list(string)
  default = null
}

variable "subnet_id" {
  type = string
}

variable "acr_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
