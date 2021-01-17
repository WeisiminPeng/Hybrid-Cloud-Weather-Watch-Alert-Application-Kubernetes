'use strict';
const config = require('../config/config');
const mysql = require('../config/mysql.js');
const producer = require('../config/kafka.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const { watch } = require('fs');

// prom-client and pushgateway for metrics
const promclient = require('../config/promclient');
const pushgateway = require('../config/pushgateway');

// watch
const gauge_insert_new_watch = new promclient.Gauge({ name: 'mysql_insert_new_watch', help: 'mysql_insert_new_watch_help', labelNames: ['instance'] });
const counter_insert_new_watch = new promclient.Counter({
  name: 'counter_mysql_insert_new_watch',
  help: 'counter_mysql_insert_new_watch_help',
  labelNames: ['instance'],
});

const gauge_fetch_watch = new promclient.Gauge({ name: 'mysql_fetch_watch', help: 'mysql_fetch_watch_help', labelNames: ['instance'] });
const counter_fetch_watch = new promclient.Counter({
  name: 'counter_mysql_fetch_watch',
  help: 'counter_mysql_fetch_watch_help',
  labelNames: ['instance'],
});

const gauge_update_watch = new promclient.Gauge({ name: 'mysql_update_watch', help: 'mysql_update_watch_help', labelNames: ['instance'] });
const counter_update_watch = new promclient.Counter({
  name: 'counter_mysql_update_watch',
  help: 'counter_mysql_update_watch_help',
  labelNames: ['instance'],
});

const gauge_delete_watch = new promclient.Gauge({ name: 'mysql_delete_watch', help: 'mysql_delete_watch_help', labelNames: ['instance'] });
const counter_delete_watch = new promclient.Counter({
  name: 'counter_mysql_delete_watch',
  help: 'counter_mysql_delete_watch_help',
  labelNames: ['instance'],
});

// alert
const gauge_insert_new_alert = new promclient.Gauge({ name: 'mysql_insert_new_alert', help: 'mysql_insert_new_alert_help', labelNames: ['instance'] });
const counter_insert_new_alert = new promclient.Counter({
  name: 'counter_mysql_insert_new_alert',
  help: 'counter_mysql_insert_new_alert_help',
  labelNames: ['instance'],
});

const gauge_fetch_alert = new promclient.Gauge({ name: 'mysql_fetch_alert', help: 'mysql_fetch_alert_help', labelNames: ['instance'] });
const counter_fetch_alert = new promclient.Counter({
  name: 'counter_mysql_fetch_alert',
  help: 'counter_mysql_fetch_alert_help',
  labelNames: ['instance'],
});

// kafka producer
const gauge_kafka_topic_watch_producer = new promclient.Gauge({ name: 'kafka_topic_watch_producer', help: 'kafka_topic_watch_producer_help', labelNames: ['instance'] });
const counter_kafka_topic_watch_producer = new promclient.Counter({
  name: 'counter_kafka_topic_watch_producer',
  help: 'counter_kafka_topic_watch_producer',
  labelNames: ['instance'],
});



// Find a watch by ID
exports.findByID = function (req, result) {

  // Parse jwt token from authorization field
  let token = req.headers['authorization'].split(' ')[1];

  // Verify if the token is valid
  jwt.verify(token, config.secret, { issuer: config.hostname }, function(err, decoded) {
    if(err){
      result({status: 401, message: "Your token is invalid!"}, null);
      //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
      return;
    }
    else{
      let id = decoded.sub;
      let watch_id = req.params.watch_id;

      // Get watch information
      let query_start1 = new Date().getTime();
      mysql.query(`SELECT * FROM watch WHERE watch_id = "${watch_id}"`, (err, res) => {
        let query_end1 = new Date().getTime();
        counter_fetch_watch.labels('webapp').inc(); // Increment by 1
        gauge_fetch_watch.labels('webapp').set(query_end1 - query_start1);
        pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
          if (err) {
            console.log(`Error: ${err}`);
          }
        });

        if (err) {
          //logger.error("Error from query in search user process: " + params, { service: "Server" })
          console.error("Error: ", err);
          result({status: 500, message: err.sqlMessage}, null);
          return;
        }

        if(!res.length){
          result({status: 404, message: "No matching watch!"}, null);
          return;
        }

        let watch = res[0];

        let query_start2 = new Date().getTime();
        mysql.query(`SELECT * FROM alert WHERE watch_id = "${watch_id}"`, (err, res) => {
          counter_fetch_alert.labels('webapp').inc(); // Increment by 1
          let query_end2 = new Date().getTime();
          gauge_fetch_alert.labels('webapp').set(query_end2 - query_start2);
          pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
              console.log(`Error: ${err}`);
            }
          });

            if (err) {
              //logger.error("Error from query in search user process: " + params, { service: "Server" })
              console.error("Error: ", err);
              result({status: 500, message: err.sqlMessage}, null);
              return;
            }
    
            let alerts = res;    
            watch.alerts = alerts;
            console.info("INFO: Watch " + watch.watch_id + " is queried.");
            result(null, watch);
            return;
        });
      });
    }
  });
};

// Find all watches for the user
exports.findAll = function (req, result) {
    

    // Parse jwt token from authorization field
    let token = req.headers['authorization'].split(' ')[1];
  
    // Verify if the token is valid
    jwt.verify(token, config.secret, { issuer: config.hostname }, function(err, decoded) {
      if(err){
        console.error(err);
        result({status: 401, message: "Your token is invalid!"}, null);
        //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
        return;
      }
      else{
        let id = decoded.sub;
  
        // Get watch information
        let query_start3 = new Date().getTime();
        mysql.query(`SELECT * FROM watch WHERE user_id = "${id}"`, (err, res) => {
          counter_fetch_watch.labels('webapp').inc(); // Increment by 1
          let query_end3 = new Date().getTime();
          gauge_fetch_watch.labels('webapp').set(query_end3 - query_start3);
          pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
              console.log(`Error: ${err}`);
            }
          });
  
          if (err) {
            //logger.error("Error from query in search user process: " + params, { service: "Server" })
            console.error("Error: ", err);
            result({status: 500, message: err.sqlMessage}, null);
            return;
          }
  
          if(!res.length){
            result({status: 404, message: "No matching watch!"}, null);
            return;
          }
  
          let watches = res;
          let watches_processed = 0;
          let watches_result = [];
  
          watches.forEach(element =>{
            let query_start4 = new Date().getTime();
            mysql.query(`SELECT * FROM alert WHERE watch_id = "${element.watch_id}"`, (err, res) => {
              counter_fetch_alert.labels('webapp').inc(); // Increment by 1
              let query_end4 = new Date().getTime();
              gauge_fetch_alert.labels('webapp').set(query_end4 - query_start4);
              pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                if (err) {
                  console.log(`Error: ${err}`);
                }
              });
                watches_processed++;
                if (err) {
                    //logger.error("Error from query in search user process: " + params, { service: "Server" })
                    console.error("Error: ", err);
                    result({status: 500, message: err.sqlMessage}, null);
                    return;
                }
        
                let alerts = res;    
                element.alerts = alerts;
                watches_result.push(element);
                if(watches_processed == watches.length){
                    console.info("INFO: All the watches are being queried.");
                    result(null, watches_result);
                    return;
                }

            });
          });

        });
      }
    });
};

// Create a watch
exports.createWatch = function (req, result) {

    // Parse jwt token from authorization field
    let token = req.headers['authorization'].split(' ')[1];
  
    // Verify if the token is valid
    jwt.verify(token, config.secret, { issuer: config.hostname }, function(err, decoded) {
      if(err){
        result({status: 401, message: "Your token is invalid!"}, null);
        //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
        return;
      }
      else{
        let id = decoded.sub;

        let query_start5 = new Date().getTime();
        mysql.query("INSERT INTO watch SET watch_id=?, user_id=?, zipcode=?; SELECT * FROM watch ORDER BY watch_created DESC LIMIT 1;", [uuid.v4(), id, req.body.zipcode], (err, res) => {
          counter_insert_new_watch.labels('webapp').inc(); // Increment by 1
          let query_end5 = new Date().getTime();
          gauge_insert_new_watch.labels('webapp').set(query_end5 - query_start5);
          pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
              console.log(`Error: ${err}`);
            }
          });
            if (err) {
                //logger.error("Error from query in search user process: " + params, { service: "Server" })
                console.error("Error: ", err);
                result({status: 400, message: err.sqlMessage}, null);
                return;
            }
            let watch_created = res[1][0];
            let alert_arr = [];
            req.body.alerts.forEach(element => {
                alert_arr.push([uuid.v4(), watch_created.watch_id ,element.field_type, element.operator, element.value]);
            });

            

            let query_start6 = new Date().getTime();
            mysql.query("INSERT INTO alert (alert_id, watch_id, field_type, operator, value) VALUES ?; SELECT * FROM alert where watch_id=?;", [alert_arr, watch_created.watch_id], (err, res) => {
              counter_insert_new_alert.labels('webapp').inc(); // Increment by 1
              let query_end6 = new Date().getTime();
              gauge_insert_new_alert.labels('webapp').set(query_end6 - query_start6);
              pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                if (err) {
                  console.log(`Error: ${err}`);
                }
              });
                if (err) {
                    //logger.error("Error from query in search user process: " + params, { service: "Server" })
                    console.error("Error: ", err);
                    result({status: 400, message: err.sqlMessage}, null);
                    return;
                }

                watch_created.alerts = res[1];

                // Prepare kafka message
                let payloads = [{
                  topic: 'watch',
                  messages: [JSON.stringify({"action":"create", "data": watch_created})],
                  timestamp: Date.now()
                }];

                // result(null, watch_created);
                // return;
                console.info("INFO: New watch " + watch_created.watch_id + " is created.");
                
                let query_start10 = new Date().getTime();
                producer.send(payloads, function (err, data) {
                  counter_kafka_topic_watch_producer.labels('webapp').inc(); // Increment by 1
                  let query_end10 = new Date().getTime();
                  gauge_kafka_topic_watch_producer.labels('webapp').set(query_end10 - query_start10);
                  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                    if (err) {
                      console.log(`Error: ${err}`);
                    }
                  });
                  if (err) {
                    console.error("Error: ", err);
                    result({status: 500, message: "Kafka message failed to send!"}, null);
                    return;
                  }
                  console.info("INFO: Watch " + watch_created.watch_id + " creation is sent to Kafka topic.");
                  result(null, watch_created);
                  return;
                });


            });
        });
      }
    });
};

// Update a watch
exports.updateWatch = function (req, result) {
    // Parse jwt token from authorization field
    let token = req.headers['authorization'].split(' ')[1];
  
    // Verify if the token is valid
    jwt.verify(token, config.secret, { issuer: config.hostname }, function(err, decoded) {
      if(err){
        result({status: 401, message: "Your token is invalid!"}, null);
        //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
        return;
      }
      else{
        let id = decoded.sub;
        let watch_id = req.params.watch_id;

        let query_start7 = new Date().getTime();
        mysql.query("UPDATE watch SET zipcode=? WHERE watch_id = ?; SELECT * FROM watch where watch_id=?;",[req.body.zipcode, watch_id, watch_id], (err, res) => {
          counter_update_watch.labels('webapp').inc(); // Increment by 1
          let query_end7 = new Date().getTime();
          gauge_update_watch.labels('webapp').set(query_end7 - query_start7);
          pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
              console.log(`Error: ${err}`);
            }
          });
            if (err) {
                //logger.error("Error from query in authentication process: " + email, { service: "Server" });
                console.error("Error: ", err);
                result({status: 500, message: err.sqlMessage}, null);
                return;
            }

            if(res[0].affectedRows == 0){
                result({status: 404, message: "No matching watch!"}, null);
                return;
            }

            var watch_updated = res[1][0];

            // Prepare alerts for bulk insert
            let alert_arr = [];
            req.body.alerts.forEach(element => {
                alert_arr.push([uuid.v4(), watch_id ,element.field_type, element.operator, element.value]);
            });

            let query_start8 = new Date().getTime();
            mysql.query("DELETE FROM alert where watch_id =?; INSERT INTO alert (alert_id, watch_id, field_type, operator, value) VALUES ?;SELECT * FROM alert where watch_id=?;", [watch_id, alert_arr, watch_id], (err, res) => {
              counter_delete_watch.labels('webapp').inc(); // Increment by 1
              let query_end8 = new Date().getTime();
              gauge_delete_watch.labels('webapp').set(query_end8 - query_start8);
              pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                if (err) {
                  console.log(`Error: ${err}`);
                }
              });
                if (err) {
                    //logger.error("Error from query in search user process: " + params, { service: "Server" })
                    console.error("Error: ", err);
                    result({status: 400, message: err.sqlMessage}, null);
                    return;
                }

                watch_updated.alerts = res[2];

                // Prepare kafka message
                let payloads = [{
                  topic: 'watch',
                  messages: [JSON.stringify({"action":"update", "data": watch_updated})],
                  timestamp: Date.now()
                }];

                // result(null, watch_updated);
                // return;
                console.info("INFO: Watch " + watch_updated.watch_id + " is updated.");

                let query_start11 = new Date().getTime();
                producer.send(payloads, function (err, data) {
                  counter_kafka_topic_watch_producer.labels('webapp').inc(); // Increment by 1
                  let query_end11 = new Date().getTime();
                  gauge_kafka_topic_watch_producer.labels('webapp').set(query_end11 - query_start11);
                  pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                    if (err) {
                      console.log(`Error: ${err}`);
                    }
                  });
                  if (err) {
                    console.error("error: ", err);
                    result({status: 500, message: "Kafka message failed to send!"}, null);
                    return;
                  }
                  console.info("INFO: Watch " + watch_updated.watch_id + " update is sent to Kafka topic.");
                  result(null, watch_updated);
                  return;
                });
            });
        });
      }
    });
};

// Delete a watch
exports.deleteWatch = function (req, result) {
    // Parse jwt token from authorization field
    let token = req.headers['authorization'].split(' ')[1];
  
    // Verify if the token is valid
    jwt.verify(token, config.secret, { issuer: config.hostname }, function(err, decoded) {
      if(err){
        console.error(err);
        result({status: 401, message: "Your token is invalid!"}, null);
        //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
        return;
      }
      else{
        let id = decoded.sub;
        let watch_id = req.params.watch_id;
        
        let query_start9 = new Date().getTime();
        mysql.query("DELETE FROM watch WHERE watch_id = ?",[watch_id], (err, res) => {
          counter_delete_watch.labels('webapp').inc(); // Increment by 1
          let query_end9 = new Date().getTime();
          gauge_delete_watch.labels('webapp').set(query_end9 - query_start9);
          pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
              console.log(`Error: ${err}`);
            }
          });
            if (err) {
                //logger.error("Error from query in authentication process: " + email, { service: "Server" });
                console.error("Error: ", err);
                result({status: 500, message: err.sqlMessage}, null);
                return;
            }

            if(res.affectedRows == 0){
                result({status: 404, message: "No matching watch!"}, null);
                return;
            }

            // Prepare kafka message
            let payloads = [{
              topic: 'watch',
              messages: [JSON.stringify({"action":"delete", "data": {"watch_id": watch_id}})],
              timestamp: Date.now()
            }];

            // result(null, res);
            // return;
            console.info("INFO: Watch " + watch_id + " is deleted.");

            producer.send(payloads, function (err, data) {
              if (err) {
                console.error("Error: ", err);
                result({status: 500, message: "Kafka message failed to send!"}, null);
                return;
              }
              console.info("INFO: Watch " + watch_id + " deletion is sent to Kafka topic.");
              result(null, data);
              return;
            });
        });
      }
    });  
};