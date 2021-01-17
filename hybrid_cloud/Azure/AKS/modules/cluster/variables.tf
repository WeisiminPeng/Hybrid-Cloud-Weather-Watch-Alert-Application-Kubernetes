variable "location" {
    type    = string
    default = "East US"
}

variable "instance_size" {
    type = string
    default = "Standard_D2_v3" 
}

variable "kubernetes_version" {
    type = string
    default = "1.19.3"
}

variable "availability_zones" {
    type = list(string)
    default = ["1", "2", "3"]
}

variable "ssh_key" {
    type = string
    default = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDL55ZrPVikGQgTkSEnMBpzdzUTgU3ejnwxTRuiQbPF2NFt3I+XLbxwljFr6ZoFMIl5rtX38R+/OUw0v+sBaBsCxxJKGy0mbmmH/FvI3G5tNucruYafodzotfVa+iOjs1apSEjpneerpMoZqBMh+jh0bhmbvsexmh7JIJOI3SikY8Ksk5aQUi0fkgrPYTBPkYeuBt/43Anyju8xRNNZNMgaebkJCEE5od/ThGbUiEs/Sp58voww58ERysWFe8smXnp1gt5U+KZU6ZY7wjHJlMd6SsqkvL71cuuX2WyY1PyQl6PgOxjWISYSG0L8qAoPwZfog9yM8d5FIqSUMyhphy1r yujiache@ubuntu"
}

variable "kube_vnet_address_space" {
    description = "VNET address space"
    type        = list(string)
    default = ["10.1.4.0/22"]
}

variable "kube_subnet_address_prefix" {
    description = "Subnets prefix"
    type        = list(string)
    default = ["10.1.4.0/24"]
}

variable "rds_vnet_address_space" {
    description = "VNET address space"
    type        = list(string)
    default = ["10.1.0.0/22"]
}

variable "rds_subnet_address_prefix" {
    description = "Subnets prefix"
    type        = list(string)
    default = ["10.1.0.0/24"]
}