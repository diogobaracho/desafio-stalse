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
}

provider "azurerm" {
  features {}
  # Credentials: `az login` locally; OIDC (ARM_USE_OIDC=true) in GitHub Actions.
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}
