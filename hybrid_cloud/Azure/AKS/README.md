# Infrastructure as Code


## Initialization

Initialize the terraform directory by

```
terraform init
```

## Create a Kubernetes cluster with Azure Kubernetes Service(AKS)

Check if the components are correct.  

```
terraform plan
```

Apply chanages

```
terraform apply
```

Configure kubectl
```
az aks get-credentials --resource-group <> --name <>
```

```
kubectl get nodes
```

## Destroy

Destroy the components managed by Terraform

```
terraform destroy
```
