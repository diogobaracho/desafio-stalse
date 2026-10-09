output "id" {
  value = azurerm_key_vault.this.id
}

output "name" {
  value = azurerm_key_vault.this.name
}

output "secrets_officer_assignment_id" {
  description = "Depend on this before writing secrets from other modules."
  value       = azurerm_role_assignment.terraform_secrets_officer.id
}
