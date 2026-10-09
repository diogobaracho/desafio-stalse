output "state_storage_account_name" {
  value = azurerm_storage_account.state.name
}

output "github_identities" {
  description = "Set client_id as AZURE_CLIENT_ID and principal_id as TF_VAR_ci_principal_id per GitHub environment."
  value = {
    for k, id in azurerm_user_assigned_identity.github : k => {
      github_environment = local.environments[k].github_env
      client_id          = id.client_id
      principal_id       = id.principal_id
    }
  }
}

output "tenant_id" {
  value = azurerm_user_assigned_identity.github["dev"].tenant_id
}
