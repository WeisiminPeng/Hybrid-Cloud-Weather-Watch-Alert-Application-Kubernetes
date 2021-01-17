# Poller
<!-- Usage -->
## Usage
Pull image from the Docker hub
```sh
docker pull 
```
Run docker with database information
```sh
docker run --network="host" \
-e DBhostname='' \
-e  DBusername='' \
-e  DBpassword='' \
-e  DBname='' \
-e  POLL_INTERVAL=20000
-p 3000:3000 \
poller:env
```
