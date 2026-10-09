terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.9"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }
  # Bootstrap keeps LOCAL state (it creates the remote-state storage). Run it once, by a
  # subscription Owner, and keep the state file safe (or migrate it afterwards).
}

provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}
