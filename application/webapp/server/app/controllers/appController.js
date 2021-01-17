'use strict';

const mysql = require('../config/mysql.js');
const producer = require('../config/kafka.js'); 

// prom-client and pushgateway for metrics
const promclient = require('../config/promclient');
const pushgateway = require('../config/pushgateway');

// const counter_readiness_check = new promclient.Counter({
//     name: 'webapp_readiness_check',
//     help: 'webapp_readiness_check_help',
//     labelNames: ['instance'],
//   });

exports.checkReadiness = function(req, res){
    console.info("INFO: Readiness check!");
    if(mysql && producer)
        res.status(200).send({status: 'UP'});
    else
        res.status(500).send('Application is not ready');
}

exports.checkLiveness = function(req, res){
    console.info("INFO: liveness check!");
    if(mysql && producer)
        res.status(200).send({status: 'UP'});
    else
        res.status(500).send('Application is not alive');
}