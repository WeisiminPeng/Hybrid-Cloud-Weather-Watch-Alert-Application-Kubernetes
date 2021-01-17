// Enable required services on the project
resource "google_project_service" "service" {
  count   = length(var.project_services)
  project = var.project
  service = element(var.project_services, count.index)

  // Do not disable the service on destroy. On destroy, we are going to
  // destroy the project, but we need the APIs available to destroy the
  // underlying resources.
  disable_on_destroy = false
}

# VPC for k8s
resource "google_compute_network" "network" {
  name                    = "${var.project}-k8s-vpc"
  auto_create_subnetworks = "false"
  depends_on = [
    "google_project_service.service",
  ]
}

# Subnet for k8s
resource "google_compute_subnetwork" "subnetwork" {
  name          = "${var.project}-k8s-subnet"
  region        = var.region
  network       = google_compute_network.network.name
  ip_cidr_range = "10.0.0.0/24"

  secondary_ip_range {
    range_name    = format("%s-pod-range", var.cluster_name)
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = format("%s-svc-range", var.cluster_name)
    ip_cidr_range = "10.2.0.0/20"
  }

}

// Allow access to the cluster
resource "google_compute_firewall" "k8s_firewall" {
  name          = format("%s-k8s-firewall", var.cluster_name)
  network       = google_compute_network.network.name
  direction     = "INGRESS"
  project       = var.project
  source_ranges = ["0.0.0.0/0"]

  allow {
    protocol = "tcp"
    ports    = ["22", "443", "8080", "80", "8001", "8443"]
  }
}


// Create an external NAT IP
resource "google_compute_address" "nat" {
  name    = format("%s-nat-ip", var.cluster_name)
  project = var.project
  region  = var.region

  depends_on = [
    google_project_service.service
  ]
}


// Create a cloud router for use by the Cloud NAT
resource "google_compute_router" "router" {
  name    = format("%s-cloud-router", var.cluster_name)
  project = var.project
  region  = var.region
  network = google_compute_network.network.self_link

  bgp {
    asn = 64514
  }
}

// Create a NAT router so the nodes can reach DockerHub, etc
resource "google_compute_router_nat" "nat" {
  name    = format("%s-cloud-nat", var.cluster_name)
  project = var.project
  router  = google_compute_router.router.name
  region  = var.region

  nat_ip_allocate_option = "MANUAL_ONLY"

  nat_ips = [google_compute_address.nat.self_link]

  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.subnetwork.self_link
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE", "LIST_OF_SECONDARY_IP_RANGES"]

    secondary_ip_range_names = [
      google_compute_subnetwork.subnetwork.secondary_ip_range.0.range_name,
      google_compute_subnetwork.subnetwork.secondary_ip_range.1.range_name,
    ]
  }
}


# create VPC peering
# private IP address
resource "google_compute_global_address" "private_ip_address" {
  project       = var.project
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.network.self_link
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.network.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
} 


resource "random_id" "db_name_suffix" {
  byte_length = 4
}

# database instance for webapp
resource "google_sql_database_instance" "webapp_instance" {
  project             = var.project
  region              = var.region
  name                = format("%s-webapp-%s", var.cluster_name, random_id.db_name_suffix.hex)
  database_version    = "MYSQL_8_0"
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    activation_policy = "ALWAYS"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.network.self_link
    }

    disk_autoresize = false
    disk_size       = "10"
    disk_type       = "PD_SSD"
    pricing_plan    = "PER_USE"
  }
}

# database for webapp
resource "google_sql_database" "webapp_database" {
  project  = var.project
  name     = "webappdb"
  instance = google_sql_database_instance.webapp_instance.name
  depends_on = [google_sql_database_instance.webapp_instance]
}


# user for webappdb
resource "google_sql_user" "webapp_user" {
  depends_on = [google_sql_database_instance.webapp_instance]

  project  = var.project
  name     = "cloud"
  instance = google_sql_database_instance.webapp_instance.name
  # Postgres users don't have hosts, so the API will ignore this value which causes Terraform to attempt
  # to recreate the user each time.
  # See https://github.com/terraform-providers/terraform-provider-google/issues/1526 for more information.
#   host     = "%"
  password = "Mysqlcloud"
}

# poller
resource "random_id" "db_name_suffix_poller" {
  byte_length = 4
}

# database instance for poller
resource "google_sql_database_instance" "poller_instance" {
  project             = var.project
  region              = var.region
  name                = format("%s-poller-%s", var.cluster_name, random_id.db_name_suffix_poller.hex)
  database_version    = "MYSQL_8_0"
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    activation_policy = "ALWAYS"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.network.self_link
    }

    disk_autoresize = false
    disk_size       = "10"
    disk_type       = "PD_SSD"
    pricing_plan    = "PER_USE"
  }
}

# database for poller
resource "google_sql_database" "poller_database" {
  project  = var.project
  name     = "pollerdb"
  instance = google_sql_database_instance.poller_instance.name
  depends_on = [google_sql_database_instance.poller_instance]
}


# user for poller
resource "google_sql_user" "poller_user" {
  depends_on = [google_sql_database_instance.poller_instance]

  project  = var.project
  name     = "cloud"
  instance = google_sql_database_instance.poller_instance.name
  # Postgres users don't have hosts, so the API will ignore this value which causes Terraform to attempt
  # to recreate the user each time.
  # See https://github.com/terraform-providers/terraform-provider-google/issues/1526 for more information.
#   host     = "%"
  password = "Mysqlcloud"
}

# notifier
resource "random_id" "db_name_suffix_notifier" {
  byte_length = 4
}

# database instance for notifier
resource "google_sql_database_instance" "notifier_instance" {
  project             = var.project
  region              = var.region
  name                = format("%s-notifier-%s", var.cluster_name, random_id.db_name_suffix_notifier.hex)
  database_version    = "MYSQL_8_0"
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    activation_policy = "ALWAYS"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.network.self_link
    }

    disk_autoresize = false
    disk_size       = "10"
    disk_type       = "PD_SSD"
    pricing_plan    = "PER_USE"
  }
}

# database for notifier
resource "google_sql_database" "notifier_database" {
  project  = var.project
  name     = "notifierdb"
  instance = google_sql_database_instance.notifier_instance.name
  depends_on = [google_sql_database_instance.notifier_instance]
}


# user for notifier
resource "google_sql_user" "notifier_user" {
  depends_on = [google_sql_database_instance.notifier_instance]

  project  = var.project
  name     = "cloud"
  instance = google_sql_database_instance.notifier_instance.name
  # Postgres users don't have hosts, so the API will ignore this value which causes Terraform to attempt
  # to recreate the user each time.
  # See https://github.com/terraform-providers/terraform-provider-google/issues/1526 for more information.
#   host     = "%"
  password = "Mysqlcloud"
}



resource "random_id" "gke_prefix" {
  byte_length = 4
}


# GKE cluster
resource "google_container_cluster" "primary" {
  name     = "${var.project}-gke-test"
  location = var.region
  node_version = "1.16.15-gke.4300"
  min_master_version = "1.16.15-gke.4300"
  # networking_mode             = "VPC_NATIVE"

  ip_allocation_policy {
    # create_subnetwork = true
    # subnetwork_name   = format("%s-pg-%s", var.cluster_name, random_id.gke_prefix.hex)
    # use_ip_aliases                = true
    cluster_secondary_range_name  = google_compute_subnetwork.subnetwork.secondary_ip_range.0.range_name
    services_secondary_range_name = google_compute_subnetwork.subnetwork.secondary_ip_range.1.range_name
  }

#   network_policy {
#     enabled = "true"
#     provider = "CALICO"
#   }

#   // Configure various addons
#   addons_config {
#     // Enable network policy (Calico)
#     network_policy_config {
#       disabled = false
#     }
#   }


  private_cluster_config {
    enable_private_endpoint = false
    enable_private_nodes    = true
    master_ipv4_cidr_block  = "192.168.0.0/28"
  }


#   network_policy {
#     enabled = "true"
#   }


  depends_on = [
    google_project_service.service,
    google_compute_network.network,
    google_compute_subnetwork.subnetwork,
    google_compute_router_nat.nat,
  ]


  # cluster_autoscaling {
  #   enabled = true
  #   resource_limits {
  #     resource_type = "memory"
  #     minimum       = 10
  #     maximum       = 100

  #   }
  #   resource_limits {
  #     resource_type = "cpu"
  #     minimum       = 1
  #     maximum       = 10
  #   }
  # }

#    // Specify the list of CIDRs which can access the master's API
  master_authorized_networks_config {
    cidr_blocks {
      display_name = "allow_all"
      cidr_block   = "0.0.0.0/0"
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.network.name
  subnetwork = google_compute_subnetwork.subnetwork.name

  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }
}


# Separately Managed Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "${google_container_cluster.primary.name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_num_nodes
  version = "1.16.15-gke.4300"
  autoscaling {
      min_node_count = 1
      max_node_count = 2
  }


  // Repair any issues but don't auto upgrade node versions
  management {
    auto_repair  = "true"
    auto_upgrade = "false"
  }

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/trace.append",
    ]

    labels = {
      env = var.project
    }



    # preemptible  = true
    machine_type = "n1-standard-2"
    disk_type    = "pd-ssd"
    disk_size_gb = 30
    tags         = ["gke-node", "${var.project}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
      
    }
  }

  depends_on = [
    "google_container_cluster.primary",
  ]
}