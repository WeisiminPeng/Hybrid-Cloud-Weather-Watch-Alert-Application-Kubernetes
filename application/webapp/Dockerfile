# use a node base image
FROM node:latest

RUN mkdir /webapp
COPY ./server/package*.json /webapp/
WORKDIR /webapp
RUN [ "npm", "install" ]
COPY ./server/. /webapp/

#ENTRYPOINT [ "npm", "start" ]

EXPOSE 3000

CMD [ "npm", "start" ]