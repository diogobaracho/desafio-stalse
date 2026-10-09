# Remote state in the storage account created by infra/terraform/bootstrap.
# The storage account name is passed at init time (it contains a random suffix):
#   terraform init -backend-config="storage_account_name=<bootstrap output>"
terraform {
  backend "azurerm" {
    resource_group_name = "rg-stalse-tfstate"
    container_name      = "tfstate"
    key                 = "prod.tfstate"
    use_azuread_auth    = true
  }
}
