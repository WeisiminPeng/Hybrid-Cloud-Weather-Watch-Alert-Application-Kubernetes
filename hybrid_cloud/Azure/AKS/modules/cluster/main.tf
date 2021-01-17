resource "azurerm_resource_group" "rg" {
  name     = "cloud-final-project"
  location = var.location
}

resource "azurerm_virtual_network" "aks_vnet" {
  name                = "aks_vnet"
  address_space       = var.kube_vnet_address_space
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "kube_subnet" {
  name                 = "kube_subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.aks_vnet.name
  address_prefixes     = var.kube_subnet_address_prefix
  service_endpoints    = ["Microsoft.Sql"]
}

resource "azurerm_virtual_network" "rds_vnet" {
  name                = "rds_vnet"
  address_space       = var.rds_vnet_address_space
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "rds_subnet" {
  name                 = "rds_subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.rds_vnet.name
  address_prefixes     = var.rds_subnet_address_prefix
  service_endpoints    = ["Microsoft.Sql"]
}

resource "azurerm_virtual_network_peering" "peering" {
  name                      = "kube_peering"
  resource_group_name       = azurerm_resource_group.rg.name
  virtual_network_name      = azurerm_virtual_network.aks_vnet.name
  remote_virtual_network_id = azurerm_virtual_network.rds_vnet.id
}

resource "azurerm_virtual_network_peering" "peering_back" {
  name                      = "rds_peering_back"
  resource_group_name       = azurerm_resource_group.rg.name
  virtual_network_name      = azurerm_virtual_network.rds_vnet.name
  remote_virtual_network_id = azurerm_virtual_network.aks_vnet.id
}

resource "azurerm_kubernetes_cluster" "default" {
  name                = "cloud-aks"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  private_cluster_enabled = false
  dns_prefix          = "cloud-k8s"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name            = "cloud"
    node_count      = 3
    vm_size         = var.instance_size
    vnet_subnet_id = azurerm_subnet.kube_subnet.id
    availability_zones = var.availability_zones
    enable_auto_scaling = true
    max_count = 6
    min_count = 3
    os_disk_size_gb = 30
    type = "VirtualMachineScaleSets"
  }

  identity {
    type = "SystemAssigned"
  }

  linux_profile {
    admin_username = "ubuntu"
    ssh_key {
      key_data = var.ssh_key
    }
  }

  role_based_access_control {
    enabled = true
  }

  auto_scaler_profile {
    scale_down_delay_after_add = "1m"
  }

  tags = {
    environment = "Demo"
  }
}

resource "azurerm_mysql_server" "webappdb" {
  name                = "webappdb-cloud"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  administrator_login          = "cloud"
  administrator_login_password = "Mysqlcloud"

  sku_name   = "GP_Gen5_2"
  storage_mb = 10240
  version    = "8.0"

  auto_grow_enabled                 = false
  geo_redundant_backup_enabled      = false
  infrastructure_encryption_enabled = false
  public_network_access_enabled     = true
  ssl_enforcement_enabled           = false
}

resource "azurerm_mysql_database" "webappdb" {
  name                = "webappdb"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.webappdb.name
  charset             = "utf8"
  collation           = "utf8_unicode_ci"
}

resource "azurerm_mysql_virtual_network_rule" "webappdb-rule" {
  name                = "webappdb-connection"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.webappdb.name
  subnet_id           = azurerm_subnet.kube_subnet.id
}

resource "azurerm_mysql_server" "pollerdb" {
  name                = "pollerdb-cloud"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  administrator_login          = "cloud"
  administrator_login_password = "Mysqlcloud"

  sku_name   = "GP_Gen5_2"
  storage_mb = 10240
  version    = "8.0"

  auto_grow_enabled                 = false
  geo_redundant_backup_enabled      = false
  infrastructure_encryption_enabled = false
  public_network_access_enabled     = true
  ssl_enforcement_enabled           = false
}

resource "azurerm_mysql_database" "pollerdb" {
  name                = "pollerdb"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.pollerdb.name
  charset             = "utf8"
  collation           = "utf8_unicode_ci"
}

resource "azurerm_mysql_virtual_network_rule" "pollerdb-rule" {
  name                = "pollerdb-connection"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.pollerdb.name
  subnet_id           = azurerm_subnet.kube_subnet.id
}

resource "azurerm_mysql_server" "notifierdb" {
  name                = "notifierdb-cloud"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  administrator_login          = "cloud"
  administrator_login_password = "Mysqlcloud"

  sku_name   = "GP_Gen5_2"
  storage_mb = 10240
  version    = "8.0"

  auto_grow_enabled                 = false
  geo_redundant_backup_enabled      = false
  infrastructure_encryption_enabled = false
  public_network_access_enabled     = true
  ssl_enforcement_enabled           = false
}

resource "azurerm_mysql_database" "notifierdb" {
  name                = "notifierdb"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.notifierdb.name
  charset             = "utf8"
  collation           = "utf8_unicode_ci"
}

resource "azurerm_mysql_virtual_network_rule" "notifierdb-rule" {
  name                = "notifierdb-connection"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_server.notifierdb.name
  subnet_id           = azurerm_subnet.kube_subnet.id
}
