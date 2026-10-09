resource "azurerm_container_registry" "this" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  admin_enabled       = false # pulls use the AKS kubelet identity; pushes use GitHub OIDC
  tags                = var.tags
}
