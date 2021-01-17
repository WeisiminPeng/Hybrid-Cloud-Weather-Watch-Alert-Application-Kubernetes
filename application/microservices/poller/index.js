const mysql = require('./config/mysql.js');
const express = require('express');

const promclient = require('prom-client');
const pushgateway = new promclient.Pushgateway('http://pushgateway-prometheus-pushgateway.monitoring:9091/');

// kafka weather producer
const gauge_kafka_topic_weather_producer = new promclient.Gauge({ name: 'gauge_kafka_topic_weather_producer', help: 'kafka_topic_weather_producer_help', labelNames: ['instance'] });
const counter_kafka_topic_weather_producer= new promclient.Counter({
    name: 'counter_kafka_topic_weather_producer',
    help: 'counter_kafka_topic_weather_producer_help',
    labelNames: ['instance'],
});
// weather api
const gauge_weather_api = new promclient.Gauge({ name: 'weather_api', help: 'weather_api_help', labelNames: ['instance'] });
const counter_weather_api= new promclient.Counter({
    name: 'counter_weather_api',
    help: 'counter_weather_api_help',
    labelNames: ['instance'],
});
// kafka watch consumer
const counter_kafka_topic_watch_consumer = new promclient.Counter({
    name: 'kafka_topic_watch_consumer',
    help: 'kafka_topic_watch_consumer_help',
    labelNames: ['instance'],
});
// mysql gauge and counter
const gauge_insert_poller_alert = new promclient.Gauge({ name: 'mysql_insert_poller_alert', help: 'insert_poller_alert_help', labelNames: ['instance'] });
const counter_insert_poller_alert= new promclient.Counter({
    name: 'counter_mysql_insert_poller_alert',
    help: 'counter_mysql_insert_poller_alert_help',
    labelNames: ['instance'],
});

const gauge_fetch_poller_alert = new promclient.Gauge({ name: 'mysql_fetch_poller_alert', help: 'mysql_fetch_poller_alert_help', labelNames: ['instance'] });
const counter_fetch_poller_alert= new promclient.Counter({
    name: 'counter_mysql_fetch_poller_alert',
    help: 'counter_mysql_fetch_poller_alert_help',
    labelNames: ['instance'],
});

const gauge_delete_poller_alert = new promclient.Gauge({ name: 'mysql_delete_poller_alert', help: 'mysql_delete_poller_alert_help', labelNames: ['instance'] });
const counter_delete_poller_alert= new promclient.Counter({
    name: 'counter_mysql_delete_poller_alert',
    help: 'counter_mysql_delete_poller_alert_help',
    labelNames: ['instance'],
});



// For health and liveness probe
const PORT = 8080;
const HOST = '0.0.0.0';
// App
const app = express();
app.get('/ready', (req, res) => {
    console.info("INFO: Readiness check!");
    if(mysql && kafka)
        res.status(200).send({status: 'UP'});
    else
        res.status(500).send('Application is not ready');
});

app.get('/live', (req, res) => {
    console.info("INFO: Liveness check!");
    if(mysql && kafka)
        res.status(200).send({status: 'LIVE'});
    else
        res.status(500).send('Application is not alive');
});

app.listen(PORT, HOST);

var kafka = require('kafka-node'),
    // Consumer = kafka.Consumer,
    ConsumerGroup = kafka.ConsumerGroup,
    Producer = kafka.Producer,
    client = new kafka.KafkaClient({
        // external docker
        //kafkaHost: 'localhost:9092'
        // internal docker
        kafkaHost: process.env.KAFKAHOST
    })

const producer = new Producer(client);


const axios = require('axios');

var topic = 'watch';

var topics = [{
    topic: topic
}],
    // options = {
    //     groupId: 'poller_group',
    //     autoCommit: false,
    //     fetchMaxWaitMs: 1000,
    //     fetchMaxBytes: 1024 * 1024,
    //     fromBeginning: true
    // };

    groupOptions = {
        kafkaHost: process.env.KAFKAHOST,
        groupId: 'poller_group',
        protocol: ['roundrobin'],
        encoding: 'utf8',
        sessionTimeout: 15000
    };

let flag = false;
let msg, payloads;

// var consumer = new Consumer(client, topics, options);
var consumer = new ConsumerGroup(groupOptions, 'watch');

producer.on('ready', function () {
    flag = true;
    console.log('INFO: poller Kafka Producer is ready!');
});

producer.on('error', function (err) {
    console.error(err);
});

// Start to receive message
consumer.on('message', function (message) {
    
    counter_kafka_topic_watch_consumer.labels('poller').inc(); // Increment by 1
    pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
        if (err) {
            console.log(`Error: ${err}`);
        }
    });
    console.info("INFO: Message consumed by poller. Topic:watch Id:" + message.offset);
    // console.log(message);

    var messageJSON = JSON.parse(message.value);
    let action = messageJSON.action;
    let value = messageJSON.data;


    // Create alerts from 
    if (action == "create") {
        let newAlerts = [];
        value.alerts.forEach(element => {
            newAlerts.push([element.alert_id, value.user_id, value.watch_id, value.zipcode, element.field_type, element.operator, element.value]);
        });

        let query_start1 = new Date().getTime();
        mysql.query("INSERT INTO poller_alert (alert_id, user_id, watch_id, zipcode, field_type, operator, value) VALUES ?", [newAlerts], (err, res) => {
            let query_end1 = new Date().getTime();
            counter_insert_poller_alert.labels('poller').inc(); // Increment by 1
            gauge_insert_poller_alert.labels('poller').set(query_end1 - query_start1);
            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
              if (err) {
                console.log(`Error: ${err}`);
              }
            });
            if (err) {
                console.error(err);
                return;
            }
            console.info("INFO: Successfully inserted %d rows into poller_alert table.", res.affectedRows);
        });
    }
    // Update an alert
    else if (action == "update") {
        let newAlerts = [];
        value.alerts.forEach(element => {
            newAlerts.push([element.alert_id, value.user_id, value.watch_id, value.zipcode, element.field_type, element.operator, element.value]);
        });

        let query_start2 = new Date().getTime();
        mysql.query("DELETE FROM poller_alert where watch_id=?;INSERT INTO poller_alert (alert_id, user_id, watch_id, zipcode, field_type, operator, value) VALUES ?", [value.watch_id, newAlerts], (err, res) => {
            let query_end2 = new Date().getTime();
            counter_delete_poller_alert.labels('poller').inc(); // Increment by 1
            gauge_delete_poller_alert.labels('poller').set(query_end2 - query_start2);
            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
              if (err) {
                console.log(`Error: ${err}`);
              }
            });
            if (err) {
                console.error(err);
                return;
            }
            console.info("INFO: Successfully updated %d rows into poller_alert table.", res[1].affectedRows);
        });
    }
    // Delete an alert
    else if (action == "delete") {
        let query_start3 = new Date().getTime();
        mysql.query("DELETE FROM poller_alert where watch_id=?;", [value.watch_id], (err, res) => {
            let query_end3 = new Date().getTime();
            counter_delete_poller_alert.labels('poller').inc(); // Increment by 1
            gauge_delete_poller_alert.labels('poller').set(query_end3 - query_start3);
            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
              if (err) {
                console.log(`Error: ${err}`);
              }
            });
            if (err) {
                console.error(err);
                return;
            }
            console.info("INFO: Successfully deleted %d rows into poller_alert table.", res.affectedRows);
        });
    }
    else
        console.error("Error: Action cannot be recognized!");


});

consumer.on('error', function (err) {
    console.error('Error:', err);
});

setInterval(() => {
    console.info("INFO: Polling data...");
    let query_start4 = new Date().getTime();
    mysql.query("SELECT * FROM poller_alert;", (err, res) => {
        let query_end4 = new Date().getTime();
        counter_fetch_poller_alert.labels('poller').inc(); // Increment by 1
        gauge_fetch_poller_alert.labels('poller').set(query_end4 - query_start4);
        pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
          if (err) {
            console.log(`Error: ${err}`);
          }
        });
        var withWeather = [];
        res.forEach(element => {
            // Get weather data
            let query_start5 = new Date().getTime();
            axios.get(`https://api.openweathermap.org/data/2.5/weather?zip=${element.zipcode},us&appid=b09da7830286e5fba57321911ba2110d&units=metric`)
                .then(response => {
                    let query_end5 = new Date().getTime();
                    counter_weather_api.labels('poller').inc(); // Increment by 1
                    gauge_weather_api.labels('poller').set(query_end5 - query_start5);
                    pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                        if (err) {
                            console.log(`Error: ${err}`);
                        }
                    });
                    // console.log("response.data");
                    // console.log(response.data.main);
                    // msg = {
                    //     zipcode: zipcode,
                    //     weather: response.data.main
                    // }

                    element.weather = response.data.main;
                    withWeather.push(element);
                    if (withWeather.length == res.length) {

                        payloads = [{
                            topic: 'weather',
                            messages: [JSON.stringify({ "cloud": withWeather })]
                        }
                        ];
                        let query_start6 = new Date().getTime();
                        producer.send(payloads, function (err, data) {
                            counter_kafka_topic_weather_producer.labels('poller').inc(); // Increment by 1
                            let query_end6 = new Date().getTime();
                            gauge_kafka_topic_weather_producer.labels('poller').set(query_end6 - query_start6);
                            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                                if (err) {
                                    console.log(`Error: ${err}`);
                                }
                            });
                            if (err)
                                console.error(err);
                            else
                                console.info("INFO: Alerts sent to topic Weather.");

                        });
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
    });
}, process.env.POLL_INTERVAL);
