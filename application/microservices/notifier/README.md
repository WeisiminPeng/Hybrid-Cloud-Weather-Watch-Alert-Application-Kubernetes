# Notifier   

<!-- Usage -->
## Usage
Pull image from the Docker hub
```sh
docker pull 
```
Run docker with database information
```sh
docker run --network="" \
-e DBhostname='' \
-e  DBusername='' \
-e  DBpassword='' \
-e  DBname='' \
-p 3000:3000 \
notifier
```


demo