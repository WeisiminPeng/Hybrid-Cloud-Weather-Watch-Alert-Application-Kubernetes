# kubernetes
  

<!-- Usage -->
## Usage
Set up the Kubernetes cluster on AWS
```sh
ansible-playbook setup-k8s-cluster.yml --extra-vars "AWS_PROFILE=kops AWS_REGION=us-east-1 
NAME=<empty>
KOPS_STATE_STORE='<empty>' 
COMPUTE_NODE_SIZE=t2.medium 
MASTER_NODE_SIZE=t2.medium 
VERSION=1.13.0 
NODE_COUNT=3 
DNS_ZONE=<empty>
SSH_KEY='<empty>'
rds_aws_profile=<empty>
prod_aws_profile=<empty>
k8s_request_vpc_name=<empty>
rds_accept_vpc_ower_id=<empty>
username=c<empty>
password=<empty>"  -vv
```


Delete the Kubernetes cluster
```sh
ansible-playbook delete-k8s-cluster.yml --extra-vars "AWS_PROFILE=<empty>
NAME=<empty> 
KOPS_STATE_STORE='<empty>'
rds_aws_profile=<empty> 
prod_aws_profile=<empty> 
k8s_request_vpc_name=<empty>" -vv
```

SSH into Bastion node
```sh
ssh -A admin@`aws elb --output=table describe-load-balancers|grep DNSName.\*bastion|awk '{print $4}'`
```

SSH into other nodes from Bastion node
```sh
ssh admin@ip-172-20-53-10.ec2.internal
```