data "azurerm_client_config" "current" {}

resource "azurerm_mssql_server" "this" {
  name                          = local.mssql_server_name
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  version                       = "12.0"
  minimum_tls_version           = "1.2"
  public_network_access_enabled = true

  azuread_administrator {
    login_username              = format("ca-api-%s", local.resource_suffix_kebabcase)
    object_id                   = azurerm_container_app.api.identity[0].principal_id
    tenant_id                   = data.azurerm_client_config.current.tenant_id
    azuread_authentication_only = true
  }
}

resource "azurerm_mssql_database" "this" {
  name        = local.mssql_db_name
  server_id   = azurerm_mssql_server.this.id
  sku_name    = "Basic"
  max_size_gb = 2
}

variable "dev_client_ip" {
  description = "Optional dev workstation IP allowed to reach Azure SQL."
  type = string
  default = null
}

resource "azurerm_mssql_firewall_rule" "dev_client" {
  count = var.dev_client_ip == null ? 0 : 1
  name = "dev-client"
  server_id = azurerm_mssql_server.this.id
  start_ip_address = var.dev_client_ip
  end_ip_address = var.dev_client_ip
}

resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
