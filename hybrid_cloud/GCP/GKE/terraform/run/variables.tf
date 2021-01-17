variable "region" {
  type = string
  default = "us-east1"
}

variable "project" {
  type = string
  default = "cloudfall"
}

variable "zone" {
  description = "The zone in which to create the Kubernetes cluster. Must match the region"
  type        = string
  default = "us-east1-b"
}