variable "name" {
  description = "Name suffix, e.g. stalse-dev."
  type        = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "address_space" {
  description = "VNet CIDR (/16 recommended)."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
