# use a node base image
FROM node:latest

RUN mkdir /poller
COPY ./package*.json /poller/
WORKDIR /poller
RUN [ "npm", "install" ]
COPY . /poller/
CMD [ "npm", "start" ]

# ENTRYPOINT [ "npm", "start" ]