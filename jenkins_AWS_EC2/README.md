# jenkins

## pre prepare
Elastic IP tag: Name: jenkins_elasticIP  
Put your elastic ip and ssh info into a host file  

## command 
cd your path to repository 
```sh  
ansible-playbook -i host_pengwei jenkins.yml --extra-vars "domain=jenkins1.weisiminpeng.com aws_profile=aws keyName=<empty>" -v  
ansible-playbook -i host_pengwei jenkins-teardown.yml --extra-vars "aws_profile=aws" -vv 
```

## login jenkins
url: your domain  
the jenkins password will be in initialAdminPassword folder  

rm -rf /var/root/.ssh/known_hosts