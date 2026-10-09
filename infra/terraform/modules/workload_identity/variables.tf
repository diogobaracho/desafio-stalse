variable "name" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "oidc_issuer_url" {
  type = string
}

variable "namespace" {
  type    = string
  default = "stalse"
}

variable "service_account" {
  type    = string
  default = "backend"
}

variable "key_vault_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
