provider "azurerm" {
    features {
      log_analytics_workspace {
        permanently_delete_on_destroy = true
      }
      resource_group {
        prevent_deletion_if_contains_resources = false
      }

    }
}

terraform {
  required_providers {
    azurerm = {
        source = "hashicorp/azurerm"
    }
  }
  required_version = ">=1.4.5"

  backend "azurerm" {}
}