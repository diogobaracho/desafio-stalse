variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "brazilsouth"
}

variable "github_repository" {
  description = "owner/repo allowed to federate (e.g. acme/stalse-mini-inbox)."
  type        = string
}
