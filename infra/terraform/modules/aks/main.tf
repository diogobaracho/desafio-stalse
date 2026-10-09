# AKS with Entra ID auth + Azure RBAC (no local accounts), OIDC issuer + workload identity,
# Key Vault Secrets Store CSI driver and Container Insights.

resource "azurerm_kubernetes_cluster" "this" {
  name                      = "aks-${var.name}"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  dns_prefix                = var.name
  kubernetes_version        = var.kubernetes_version
  sku_tier                  = var.sku_tier
  automatic_upgrade_channel = "patch"
  local_account_disabled    = true
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  default_node_pool {
    name                         = "system"
    vm_size                      = var.node_vm_size
    vnet_subnet_id               = var.subnet_id
    zones                        = var.zones
    auto_scaling_enabled         = true
    min_count                    = var.node_min_count
    max_count                    = var.node_max_count
    only_critical_addons_enabled = false
    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  # Classic autoscaled node pool (Node Auto Provisioning / Karpenter is a later option).
  node_provisioning_profile {
    mode = "Manual"
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    network_policy      = "cilium"
    network_data_plane  = "cilium"
    load_balancer_sku   = "standard"
  }

  azure_active_directory_role_based_access_control {
    tenant_id          = var.tenant_id
    azure_rbac_enabled = true
  }

  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  tags = var.tags
}

# Nodes pull images from ACR with the kubelet identity.
resource "azurerm_role_assignment" "acr_pull" {
  scope                            = var.acr_id
  role_definition_name             = "AcrPull"
  principal_id                     = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
  skip_service_principal_aad_check = true
}
