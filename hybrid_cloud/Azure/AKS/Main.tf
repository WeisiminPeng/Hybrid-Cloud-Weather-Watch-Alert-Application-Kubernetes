provider "azurerm" {
  # whilst the `version` attribute is optional, we recommend pinning to a given version of the Provider
  version = "~>2.0"
  features {}
}

module "cluster" {
  source = "./modules/cluster"
}
# az login --service-principal -u http://azure-cli-2020-12-07-23-46-03 -p "ewz2Zt_WL5OXn3MP3W-ffYhq2DtI8DJ51V" --tenant "a8eec281-aaa3-4dae-ac9b-9a398b9215e7"