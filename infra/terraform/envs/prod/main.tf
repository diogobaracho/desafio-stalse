module "stalse" {
  source = "../../modules/environment"

  environment            = "prod"
  location               = var.location
  resource_group_name    = "rg-stalse-prod"
  tenant_id              = var.tenant_id
  unique_suffix          = var.unique_suffix
  ci_principal_id        = var.ci_principal_id
  humans_group_object_id = var.humans_group_object_id
  n8n_webhook_url        = var.n8n_webhook_url

  # Prod: READ-ONLY for humans (changes only via approved CI/CD), zone-redundant, HA database.
  humans_read_only               = true
  vnet_address_space             = "10.20.0.0/16"
  zones                          = ["1", "2", "3"]
  acr_sku                        = "Standard"
  aks_sku_tier                   = "Standard"
  aks_node_vm_size               = "Standard_D2s_v5"
  aks_node_min_count             = 2
  aks_node_max_count             = 5
  postgres_sku_name              = "GP_Standard_D2ds_v5"
  postgres_backup_retention_days = 35
  postgres_high_availability     = true
  log_retention_days             = 90
}
