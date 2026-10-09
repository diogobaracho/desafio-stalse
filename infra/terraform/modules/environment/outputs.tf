# Non-secret values the CD pipeline needs (stored as GitHub environment variables).
output "aks_name" {
  value = module.aks.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_name" {
  value = module.acr.name
}

output "key_vault_name" {
  value = module.keyvault.name
}

output "backend_client_id" {
  value = module.backend_identity.client_id
}

output "postgres_fqdn" {
  value = module.postgres.fqdn
}
