provider "google" {
  credentials = file("")
  project = var.project
  region  = var.region
  zone = var.zone
}


module "term_project" {
  source = "../modules/termproject"
}


terraform {
  backend "local" {
    path = "state/terraform.tfstate"
  }
}