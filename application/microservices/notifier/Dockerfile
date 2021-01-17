# use a node base image
FROM node:latest

RUN mkdir /notifier
COPY ./package*.json /notifier/
WORKDIR /notifier
RUN [ "npm", "install" ]
COPY . /notifier/
CMD [ "npm", "start" ]

# ENTRYPOINT [ "npm", "start" ]