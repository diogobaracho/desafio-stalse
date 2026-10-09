# Key Vault in RBAC mode. The Terraform caller (CI identity) may write secrets; the backend's
# workload identity may only read them (see workload_identity module).

resource "azurerm_key_vault" "this" {
  name                          = var.name
  location                      = var.location
  resource_group_name           = var.resource_group_name
  tenant_id                     = var.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = var.purge_protection_enabled
  soft_delete_retention_days    = 7
  public_network_access_enabled = true # tighten with private endpoints as a production follow-up
  tags                          = var.tags
}

resource "azurerm_role_assignment" "terraform_secrets_officer" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.terraform_principal_id
}

resource "azurerm_key_vault_secret" "n8n_webhook_url" {
  name         = "n8n-webhook-url"
  value        = var.n8n_webhook_url
  key_vault_id = azurerm_key_vault.this.id
  content_type = "text/plain"

  depends_on = [azurerm_role_assignment.terraform_secrets_officer]
}
