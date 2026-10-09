# One Stalse environment (dev or prod) inside a resource group created by bootstrap/.
# envs/dev and envs/prod only differ by the variables they pass here.

locals {
  name = "stalse-${var.environment}"
  # Globally unique, alphanumeric names (ACR, Key Vault) derive from a short suffix.
  compact = "stalse${var.environment}${var.unique_suffix}"
  tags = merge(var.tags, {
    app         = "stalse-mini-inbox"
    environment = var.environment
    managed_by  = "terraform"
  })
}

data "azurerm_resource_group" "this" {
  name = var.resource_group_name
}

module "monitoring" {
  source              = "../monitoring"
  name                = local.name
  location            = var.location
  resource_group_name = data.azurerm_resource_group.this.name
  retention_in_days   = var.log_retention_days
  tags                = local.tags
}

module "network" {
  source              = "../network"
  name                = local.name
  location            = var.location
  resource_group_name = data.azurerm_resource_group.this.name
  address_space       = var.vnet_address_space
  tags                = local.tags
}

module "acr" {
  source              = "../acr"
  name                = local.compact
  location            = var.location
  resource_group_name = data.azurerm_resource_group.this.name
  sku                 = var.acr_sku
  tags                = local.tags
}

module "aks" {
  source                     = "../aks"
  name                       = local.name
  location                   = var.location
  resource_group_name        = data.azurerm_resource_group.this.name
  tenant_id                  = var.tenant_id
  sku_tier                   = var.aks_sku_tier
  node_vm_size               = var.aks_node_vm_size
  node_min_count             = var.aks_node_min_count
  node_max_count             = var.aks_node_max_count
  zones                      = var.zones
  subnet_id                  = module.network.aks_subnet_id
  acr_id                     = module.acr.id
  log_analytics_workspace_id = module.monitoring.workspace_id
  tags                       = local.tags
}

module "keyvault" {
  source                   = "../keyvault"
  name                     = "kv-${local.compact}"
  location                 = var.location
  resource_group_name      = data.azurerm_resource_group.this.name
  tenant_id                = var.tenant_id
  terraform_principal_id   = var.ci_principal_id
  purge_protection_enabled = var.environment == "prod"
  n8n_webhook_url          = var.n8n_webhook_url
  tags                     = local.tags
}

module "postgres" {
  source                       = "../postgres"
  name                         = local.name
  location                     = var.location
  resource_group_name          = data.azurerm_resource_group.this.name
  subnet_id                    = module.network.postgres_subnet_id
  private_dns_zone_id          = module.network.postgres_private_dns_zone_id
  key_vault_id                 = module.keyvault.id
  sku_name                     = var.postgres_sku_name
  backup_retention_days        = var.postgres_backup_retention_days
  geo_redundant_backup_enabled = var.environment == "prod"
  high_availability            = var.postgres_high_availability
  tags                         = local.tags

  depends_on = [module.keyvault]
}

module "backend_identity" {
  source              = "../workload_identity"
  name                = "${local.name}-backend"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.this.name
  oidc_issuer_url     = module.aks.oidc_issuer_url
  key_vault_id        = module.keyvault.id
  tags                = local.tags
}

# --- Access model (ADR-0012) -------------------------------------------------------------
# CI (GitHub OIDC identity) deploys workloads to the cluster.
resource "azurerm_role_assignment" "ci_aks_admin" {
  scope                = module.aks.id
  role_definition_name = "Azure Kubernetes Service RBAC Cluster Admin"
  principal_id         = var.ci_principal_id
}

resource "azurerm_role_assignment" "ci_acr_push" {
  scope                = module.acr.id
  role_definition_name = "AcrPush"
  principal_id         = var.ci_principal_id
}

# Humans: writable in dev, read-only in prod.
resource "azurerm_role_assignment" "humans_rg" {
  count                = var.humans_group_object_id == null ? 0 : 1
  scope                = data.azurerm_resource_group.this.id
  role_definition_name = var.humans_read_only ? "Reader" : "Contributor"
  principal_id         = var.humans_group_object_id
}

resource "azurerm_role_assignment" "humans_aks_user" {
  count                = var.humans_group_object_id == null ? 0 : 1
  scope                = module.aks.id
  role_definition_name = "Azure Kubernetes Service Cluster User Role"
  principal_id         = var.humans_group_object_id
}

resource "azurerm_role_assignment" "humans_aks_data" {
  count                = var.humans_group_object_id == null ? 0 : 1
  scope                = module.aks.id
  role_definition_name = var.humans_read_only ? "Azure Kubernetes Service RBAC Reader" : "Azure Kubernetes Service RBAC Writer"
  principal_id         = var.humans_group_object_id
}

# Accidental-deletion guard for production.
resource "azurerm_management_lock" "no_delete" {
  count      = var.environment == "prod" ? 1 : 0
  name       = "no-delete-${local.name}"
  scope      = data.azurerm_resource_group.this.id
  lock_level = "CanNotDelete"
  notes      = "Production: remove deliberately (see docs/guides/deployment-azure.md#teardown)."
}
