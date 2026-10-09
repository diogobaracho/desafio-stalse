# PostgreSQL Flexible Server with private (VNet) access only. The connection string is stored in
# Key Vault as `database-url`; it never appears in outputs or in Kubernetes manifests.

resource "random_password" "admin" {
  length  = 32
  special = false # keeps the URL free of characters that need escaping
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                          = "psql-${var.name}"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  version                       = "16"
  sku_name                      = var.sku_name
  storage_mb                    = var.storage_mb
  backup_retention_days         = var.backup_retention_days
  geo_redundant_backup_enabled  = var.geo_redundant_backup_enabled
  zone                          = var.zone
  delegated_subnet_id           = var.subnet_id
  private_dns_zone_id           = var.private_dns_zone_id
  public_network_access_enabled = false
  administrator_login           = "stalseadmin"
  administrator_password        = random_password.admin.result

  dynamic "high_availability" {
    for_each = var.high_availability ? [1] : []
    content {
      mode = "ZoneRedundant"
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [zone, high_availability[0].standby_availability_zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "stalse"
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  key_vault_id = var.key_vault_id
  content_type = "text/plain"
  value = format(
    "postgresql+psycopg://%s:%s@%s:5432/%s?sslmode=require",
    azurerm_postgresql_flexible_server.this.administrator_login,
    random_password.admin.result,
    azurerm_postgresql_flexible_server.this.fqdn,
    azurerm_postgresql_flexible_server_database.app.name,
  )
}
