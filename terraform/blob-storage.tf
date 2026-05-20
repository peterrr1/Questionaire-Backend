resource "azurerm_storage_account" "sa" {
  name = format("sa%s", local.resource_suffix_lowercase)
  resource_group_name = azurerm_resource_group.this.name
  location = azurerm_resource_group.this.location
  account_tier = "Standard"
  account_replication_type = "RAGRS"
  account_kind = "StorageV2"
  min_tls_version = "TLS1_2"
  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_container" "sc" {
  name = var.media_storage_container_name
  storage_account_id = azurerm_storage_account.sa.id
  container_access_type = "private"
}