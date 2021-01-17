'use strict';

//Import specific operations to database
const userService = require('../services/userServices');
const multer = require('multer');
const fs = require('fs');

// prom-client and pushgateway for metrics
const promclient = require('../config/promclient');
const pushgateway = require('../config/pushgateway');


const counter_fetch_user_without_authentication = new promclient.Counter({
  name: 'fetch_user_without_authentication',
  help: 'fetch_user_without_authentication_help',
  labelNames: ['instance'],
});

const counter_fetch_user_with_authentication = new promclient.Counter({
  name: 'fetch_user_with_authentication',
  help: 'fetch_user_with_authentication_help',
  labelNames: ['instance'],
});

const counter_register_user = new promclient.Counter({
  name: 'register_user',
  help: 'register_user_help',
  labelNames: ['instance'],
});

const counter_login_user = new promclient.Counter({
  name: 'login_user',
  help: 'login_user_help',
  labelNames: ['instance'],
});

const counter_update_user = new promclient.Counter({
  name: 'update_user',
  help: 'update_user_help',
  labelNames: ['instance'],
});

exports.search = function (req, res) {

  counter_fetch_user_without_authentication.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
    // console.log(`readiness_check_Error: ${err}`);
    // console.log(`readiness_check_Body: ${body}`);
    // console.log(`readiness_check_Response status: ${resp.statusCode}`);
  });

  userService.findByID(req.params.id, (err, data) => {
    if (err) {
      res.status(err.status).send(err.message);
    }
    else
      res.status(200).send(data);
  });
}

exports.getSelf = function (req, res) {
  counter_fetch_user_with_authentication.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
  userService.findSelf(req, (err, data) => {
    if (err) {
      res.status(err.status).send(err.message);
    }
    else
      res.status(200).send(data);
  });
}

//Register a new user
exports.registerUser = function (req, res) {
  counter_register_user.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
  userService.register(req.body, (err, data) => {
    if (err) {
      res.status(err.status).send(err.message);
    }
    else res.status(200).send(data);
  });
}

//Authenticate an user for with password
exports.authenticate = function (req, res, next) {
  counter_login_user.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
  userService.authenticate(req, (err, data) => {
    if (err) {
      res.status(err.status).send(err.message);
    } else {
      res.status(200).json(data);
    }
  });
}

exports.update = function (req, res) {
  counter_update_user.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });

  userService.updateSelf(req, (err, data) => {
    if (err) {
      res.status(err.status).send(err.message);
    }
    else
      res.status(204).send(data);
  });
}

exports.reset = function (req, res) {
  userService.reset_password(req.body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    else {
      res.status(200).json(data)
    };
  });
}

exports.testUpdate = function (req, res) {
  console.log(req.body);

  userService.testUpdate(req.body, (err, data) => {
    if (err) {
      if (err.kind === "Cannot update") {
        res.status(404).send({
          message: `Cannot update user with id ${req.body.email}.`
        });
      }
      else {
        res.status(500).send({
          message: "Error retrieving user with id " + req.body.email
        });
      }
    }
    else { res.status(200).send(data) };
  });
}

exports.logout = function (req, res) {
  res.status(200).send({ "Message": "User " + req.params.email + " logged out" });
}

//Throw error if error object is present
let renderErrorResponse = (response) => {
  const errorCallback = (error) => {
    if (error) {
      response.status(500);
      response.json({
        message: error.message
      });
    }
  }
  return errorCallback;
};