module "stalse" {
  source = "../../modules/environment"

  environment            = "dev"
  location               = var.location
  resource_group_name    = "rg-stalse-dev"
  tenant_id              = var.tenant_id
  unique_suffix          = var.unique_suffix
  ci_principal_id        = var.ci_principal_id
  humans_group_object_id = var.humans_group_object_id
  n8n_webhook_url        = var.n8n_webhook_url

  # Dev: writable for engineers, smallest SKUs, single zone.
  humans_read_only               = false
  vnet_address_space             = "10.10.0.0/16"
  acr_sku                        = "Basic"
  aks_sku_tier                   = "Free"
  aks_node_vm_size               = "Standard_B2s_v2"
  aks_node_min_count             = 1
  aks_node_max_count             = 2
  postgres_sku_name              = "B_Standard_B1ms"
  postgres_backup_retention_days = 7
  postgres_high_availability     = false
  log_retention_days             = 30
}
