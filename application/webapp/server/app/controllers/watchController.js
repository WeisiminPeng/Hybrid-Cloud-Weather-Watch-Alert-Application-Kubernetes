'use strict';

//Import specific operations to database
const watchService = require('../services/watchServices');

// prom-client and pushgateway for metrics
const promclient = require('../config/promclient');
const pushgateway = require('../config/pushgateway');


const counter_get_a_watch = new promclient.Counter({
  name: 'get_a_watch',
  help: 'get_a_watch_help',
  labelNames: ['instance'],
});

const counter_get_all_watch = new promclient.Counter({
  name: 'get_all_watch',
  help: 'get_all_watch_help',
  labelNames: ['instance'],
});

const counter_create_watch = new promclient.Counter({
  name: 'create_watch',
  help: 'create_watch_help',
  labelNames: ['instance'],
});

const counter_update_watch = new promclient.Counter({
  name: 'update_watch',
  help: 'update_watch_help',
  labelNames: ['instance'],
});

const counter_delete_watch = new promclient.Counter({
  name: 'delete_watch',
  help: 'delete_watch_help',
  labelNames: ['instance'],
});



// Get a watch 
exports.getByID = function(req, res){
  counter_get_a_watch.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
    watchService.findByID(req, (err, data) => {
      if (err) {
        res.status(err.status).send(err.message);
      } 
      else 
        res.status(200).send(data);
    });
}

// Get all watches for the user
exports.getAll = function(req, res){
  counter_get_all_watch.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
    watchService.findAll(req, (err, data) => {
      if (err) {
        res.status(err.status).send(err.message);
      } 
      else 
        res.status(200).send(data);
    });
}

// Create a new watch
exports.create = function(req, res){
  counter_create_watch.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });
    watchService.createWatch(req, (err, data) => {
      if (err) {
        res.status(err.status).send(err.message);
      } 
      else 
        res.status(201).send(data);
    });
}

// Update a watch
exports.update = function(req, res){
  counter_update_watch.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });

    watchService.updateWatch(req, (err, data) => {
      if (err) {
        res.status(err.status).send(err.message);
      } 
      else 
        res.status(204).send(data);
    });
}

// Delete a watch
exports.delete = function(req, res){
  counter_delete_watch.labels('webapp').inc(); // Increment by 1
  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
    if(err){
      console.log(`Error: ${err}`);
    }
  });

    watchService.deleteWatch(req, (err, data) => {
      if (err) {
        res.status(err.status).send(err.message);
      } 
      else 
        res.status(204).send(data);
    });
}

