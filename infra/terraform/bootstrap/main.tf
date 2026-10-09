# One-time foundation (run by a human subscription Owner):
#   - remote state storage
#   - one resource group per environment
#   - one GitHub OIDC identity per environment (no client secrets anywhere)

locals {
  environments = {
    dev = {
      resource_group   = "rg-stalse-dev"
      github_env       = "dev"
      allow_pr_subject = true # PR plans run with the dev identity
    }
    prod = {
      resource_group   = "rg-stalse-prod"
      github_env       = "production"
      allow_pr_subject = false
    }
  }
  tags = { app = "stalse-mini-inbox", managed_by = "terraform-bootstrap" }
}

resource "random_string" "state" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_resource_group" "state" {
  name     = "rg-stalse-tfstate"
  location = var.location
  tags     = local.tags
}

resource "azurerm_storage_account" "state" {
  name                            = "ststalsetf${random_string.state.result}"
  resource_group_name             = azurerm_resource_group.state.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "ZRS"
  min_tls_version                 = "TLS1_2"
  shared_access_key_enabled       = false # Entra ID auth only
  allow_nested_items_to_be_public = false
  tags                            = local.tags

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 30
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_storage_container" "state" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.state.id
  container_access_type = "private"

  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_resource_group" "env" {
  for_each = local.environments
  name     = each.value.resource_group
  location = var.location
  tags     = merge(local.tags, { environment = each.key })
}

resource "azurerm_user_assigned_identity" "github" {
  for_each            = local.environments
  name                = "id-stalse-github-${each.key}"
  resource_group_name = azurerm_resource_group.state.name
  location            = var.location
  tags                = local.tags
}

resource "azurerm_federated_identity_credential" "github_environment" {
  for_each                  = local.environments
  name                      = "github-${each.value.github_env}"
  user_assigned_identity_id = azurerm_user_assigned_identity.github[each.key].id
  issuer                    = "https://token.actions.githubusercontent.com"
  subject                   = "repo:${var.github_repository}:environment:${each.value.github_env}"
  audience                  = ["api://AzureADTokenExchange"]
}

resource "azurerm_federated_identity_credential" "github_pull_request" {
  for_each                  = { for k, v in local.environments : k => v if v.allow_pr_subject }
  name                      = "github-pull-request"
  user_assigned_identity_id = azurerm_user_assigned_identity.github[each.key].id
  issuer                    = "https://token.actions.githubusercontent.com"
  subject                   = "repo:${var.github_repository}:pull_request"
  audience                  = ["api://AzureADTokenExchange"]
}

# Least privilege: each CI identity manages only its own resource group (Contributor +
# constrained RBAC admin to create the role assignments Terraform declares) and its state blob.
resource "azurerm_role_assignment" "ci_contributor" {
  for_each             = local.environments
  scope                = azurerm_resource_group.env[each.key].id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.github[each.key].principal_id
}

resource "azurerm_role_assignment" "ci_rbac_admin" {
  for_each             = local.environments
  scope                = azurerm_resource_group.env[each.key].id
  role_definition_name = "Role Based Access Control Administrator"
  principal_id         = azurerm_user_assigned_identity.github[each.key].principal_id
}

resource "azurerm_role_assignment" "ci_state" {
  for_each             = local.environments
  scope                = azurerm_storage_container.state.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.github[each.key].principal_id
}

# Release promotion: the prod CI identity copies already-tested images from the dev registry
# (az acr import) - images are never rebuilt for production.
resource "azurerm_role_assignment" "prod_ci_pull_from_dev" {
  scope                = azurerm_resource_group.env["dev"].id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.github["prod"].principal_id
}
