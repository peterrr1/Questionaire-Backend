resource "azurerm_container_app" "api" {
  name = format("ca-api-%s", local.resource_suffix_kebabcase)
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name = azurerm_resource_group.this.name
  revision_mode = "Single"


  lifecycle {
    ignore_changes = [
        template.0.container[0].image
    ]
  }


  secret {
    name = "default-quiz-id"
    value = var.default_quiz_id
  }

  secret {
    name = "container-registry-password"
    value = azurerm_container_registry.this.admin_password
  }

  secret {
    name = "jwt-access"
    value = var.jwt_access_secret
  }

  secret {
    name = "jwt-refresh"
    value = var.jwt_refresh_secret
  }

  secret {
    name  = "default-user-password"
    value = var.default_user_password
  }


  registry {
    server = azurerm_container_registry.this.login_server
    username = azurerm_container_registry.this.admin_username
    password_secret_name = "container-registry-password"
  }

  ingress {
    external_enabled = true
    target_port = 3000

    traffic_weight {
        percentage = 100
        latest_revision = true
    }
  }

  identity {
    type = "SystemAssigned"
  }

  template {
    container {
        name = format("ca-api")
        image = "crdevweqairedemo01.azurecr.io/questionaire-dev:latest"
        cpu = 0.25
        memory = "0.5Gi"

        env {
            name = "DEFAULT_QUIZ_ID"
            secret_name = "default-quiz-id"
        }

        env {
            name = "JWT_ACCESS_SECRET"
            secret_name = "jwt-access"
        }

        env {
          name = "JWT_REFRESH_SECRET"
          secret_name = "jwt-refresh"
        }

        env {
          name = "COSMOS_DB_ENDPOINT"
          value = azurerm_cosmosdb_account.this.endpoint
        }

        env {
          name = "COSMOS_DB_NAME"
          value = azurerm_cosmosdb_sql_database.this.name
        }
        
        env {
          name = "COSMOS_DB_CONTAINER_NAME"
          value = azurerm_cosmosdb_sql_container.this.name
        }

        env {
          name = "AZURE_CONNECTION_STRING"
          value = azurerm_storage_account.sa.primary_connection_string
        }

        env {
          name  = "DB_TYPE"
          value = "mssql"
        }

        env {
          name  = "MSSQL_DB_HOST"
          value = local.mssql_server_fqdn
        }
        env {
          name  = "MSSQL_DB_NAME"
          value = local.mssql_db_name
        }

        env {
          name  = "DEFAULT_QUIZ_NAME"
          value = var.default_quiz_name
        }

        env {
          name  = "DEFAULT_USER_EMAIL"
          value = var.default_user_email
        }

        env {
          name  = "DEFAULT_USER_NAME"
          value = var.default_user_name
        }

        env {
          name        = "DEFAULT_USER_PASSWORD"
          secret_name = "default-user-password"
        }
    }
    min_replicas = 1
  }
}