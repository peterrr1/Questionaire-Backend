locals {
  resource_lowercase_array  = [lower(var.environment), lower(var.region), lower(var.application), var.resource_group_name_suffix]
  resource_suffix_kebabcase = join("-", local.resource_lowercase_array)
  resource_suffix_lowercase = join("", local.resource_lowercase_array)

  mssql_server_name = format("sql-%s", local.resource_suffix_kebabcase)
  mssql_server_fqdn = format("%s.database.windows.net", local.mssql_server_name)
  mssql_db_name     = format("sqldb-%s", local.resource_suffix_kebabcase)

  tags = merge(
    var.tags,
    tomap(
      {
        "Creator"     = var.creator,
        "Environment" = var.environment,
        "Region"      = var.region,
        "Repository"  = var.repository,
        "Application" = var.application,
      }
    )
  )
}