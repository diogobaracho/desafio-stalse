output "aks_name" {
  value = module.stalse.aks_name
}

output "acr_login_server" {
  value = module.stalse.acr_login_server
}

output "acr_name" {
  value = module.stalse.acr_name
}

output "key_vault_name" {
  value = module.stalse.key_vault_name
}

output "backend_client_id" {
  value = module.stalse.backend_client_id
}

output "resource_group_name" {
  value = "rg-stalse-dev"
}
