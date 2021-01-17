'use strict';
const mysql = require('./config/mysql.js');
const express = require('express');

const promclient = require('prom-client');
const pushgateway = new promclient.Pushgateway('http://pushgateway-prometheus-pushgateway.monitoring:9091/');


// kafka weather consumer
const counter_kafka_topic_weather_consumer = new promclient.Counter({
    name: 'kafka_topic_weather_consumer',
    help: 'kafka_topic_weather_consumer_help',
    labelNames: ['instance'],
});

// mysql gauge and counter
const gauge_insert_alert_status = new promclient.Gauge({ name: 'mysql_insert_alert_status', help: 'insert_alert_status_help', labelNames: ['instance'] });
const counter_insert_alert_status = new promclient.Counter({
    name: 'counter_mysql_insert_alert_status',
    help: 'counter_mysql_insert_alert_status_help',
    labelNames: ['instance'],
});

const gauge_fetch_alert_status = new promclient.Gauge({ name: 'mysql_fetch_alert_status', help: 'mysql_fetch_alert_status_help', labelNames: ['instance'] });
const counter_fetch_alert_status = new promclient.Counter({
    name: 'counter_mysql_fetch_alert_status',
    help: 'counter_mysql_fetch_alert_status_help',
    labelNames: ['instance'],
});

const gauge_delete_alert_status = new promclient.Gauge({ name: 'mysql_delete_alert_status', help: 'mysql_delete_alert_status_help', labelNames: ['instance'] });
const counter_delete_alert_status = new promclient.Counter({
    name: 'counter_mysql_delete_alert_status',
    help: 'counter_mysql_delete_alert_status_help',
    labelNames: ['instance'],
});

const gauge_update_alert_status = new promclient.Gauge({ name: 'mysql_update_alert_status', help: 'mysql_update_alert_status_help', labelNames: ['instance'] });
const counter_update_alert_status = new promclient.Counter({
    name: 'counter_mysql_update_alert_status',
    help: 'counter_mysql_update_alert_status_help',
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
    client = new kafka.KafkaClient({
        // kafkaHost: 'localhost:9092'
        kafkaHost: process.env.KAFKAHOST
    })
var topic = 'weather';

var topics = [{
    topic: topic
}],
    // options = {
    //     groupId: "notifier_group",
    //     autoCommit: false,
    //     fetchMaxWaitMs: 1000,
    //     fetchMaxBytes: 1024 * 1024
    // };
    groupOptions = {
        kafkaHost: process.env.KAFKAHOST,
        groupId: 'notifier_group',
        protocol: ['roundrobin'],
        encoding: 'utf8',
        sessionTimeout: 15000
    };

// var consumer = new Consumer(client, topics, options);
var consumer = new ConsumerGroup(groupOptions, 'weather');
var weather;
var alertlist;

consumer.on('message', function (message) {
    counter_kafka_topic_weather_consumer.labels('notifier').inc(); // Increment by 1
    pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
        if (err) {
            console.log(`Error: ${err}`);
        }
    });
    console.info("INFO: Message consumed by notifier. Topic:watch Id:" + message.offset);
    // console.log(message.value);
    var data = JSON.parse(message.value).cloud;
    for (var i = 0; i < data.length; i++) {
        weather = data[i].weather;
        var alert = data[i];

        compare(weather, alert);
        // console.log(weather)
        // alertlist = data[i].alertlist;
        // for (var j = 0; j < alertlist.length; j++) {
        //     // console.log(alertlist[j])
        //     var alert = alertlist[j];
        //     compare(weather, alert);
        // }

    }
});

consumer.on('error', function (err) {
    console.error('Error: ', err);
});



function compare(weather, alert) {
    // temp
    if (alert.field_type == "temp") {
        if (alert.operator == "gt") {
            if (weather.temp > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.temp >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.temp == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.temp < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.temp <= alert.value) {
                changeMysql(alert);
            }
        }
    }
    // feels_like
    if (alert.field_type == "feels_like") {
        if (alert.operator == "gt") {
            if (weather.feels_like > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.feels_like >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.feels_like == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.feels_like < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.feels_like <= alert.value) {
                changeMysql(alert);
            }
        }
    }
    // temp_min
    if (alert.field_type == "temp_min") {
        if (alert.operator == "gt") {
            if (weather.temp_min > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.temp_min >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.temp_min == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.temp_min < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.temp_min <= alert.value) {
                changeMysql(alert);
            }
        }
    }
    // temp_max
    if (alert.field_type == "temp_max") {
        if (alert.operator == "gt") {
            if (weather.temp_max > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.temp_max >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.temp_max == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.temp_max < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.temp_max <= alert.value) {
                changeMysql(alert);
            }
        }
    }
    // pressure
    if (alert.field_type == "pressure") {
        if (alert.operator == "gt") {
            if (weather.pressure > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.pressure >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.pressure == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.pressure < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.pressure <= alert.value) {
                changeMysql(alert);
            }
        }
    }
    // humidity
    if (alert.field_type == "humidity") {
        if (alert.operator == "gt") {
            if (weather.humidity > alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "gte") {
            if (weather.humidity >= alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "eq") {
            if (weather.humidity == alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lt") {
            if (weather.humidity < alert.value) {
                changeMysql(alert);
            }
        }
        if (alert.operator == "lte") {
            if (weather.humidity <= alert.value) {
                changeMysql(alert);
            }
        }
    }
}

function changeMysql(alert) {
    let query_start1 = new Date().getTime();
    mysql.query(`SELECT * FROM notifier WHERE user_id = "${alert.user_id}"`, (err, res) => {
        let query_end1 = new Date().getTime();
        counter_fetch_alert_status.labels('notifier').inc(); // Increment by 1
        gauge_fetch_alert_status.labels('notifier').set(query_end1 - query_start1);
        pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
            if (err) {
                console.log(`Error: ${err}`);
            }
        });
        if (err) {
            console.error("Error: ", err);
            return;
        }

        if (res.length == 0) {
            var alertRecord = {
                user_id: alert.user_id,
                status: "ALERT_SEND",
                alert_id: alert.alert_id,
                alert_created: Date.now(),
                alert_updated: Date.now()
            }
            let query_start2 = new Date().getTime();
            mysql.query("INSERT INTO notifier SET ?", alertRecord, (err, res) => {
                let query_end2 = new Date().getTime();
                counter_insert_alert_status.labels('notifier').inc(); // Increment by 1
                gauge_insert_alert_status.labels('notifier').set(query_end2 - query_start2);
                pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                    if (err) {
                        console.log(`Error: ${err}`);
                    }
                });
                if (err) {
                    //logger.error("Error from query in register process: " + newUser.email, { service: "Server" });
                    console.error("Error: ", err);
                    return;
                }
                console.info("INFO: Successfully sent alert to: " + alert.user_id + " for " + alert.field_type + " " + alert.operator + " " + alert.value)
            });
            return;
        }
        if (res.length == 1) {
            let alertData = res[0];
            let now = Date.now();
            // console.log(now)
            // console.log(alertData.alert_created)
            // console.log(alertData.alert_created.valueOf())
            let difference = now - alertData.alert_created;
            // console.log(difference)
            if (difference >= 3600000) {
                // if (difference >= 300000) {
                var alertRecord = {
                    user_id: alert.user_id,
                    status: "ALERT_SEND",
                    alert_id: alert.alert_id,
                    alert_created: Date.now(),
                    alert_updated: Date.now()
                }
                let query_start3 = new Date().getTime();
                mysql.query("DELETE FROM notifier WHERE user_id = ?; INSERT INTO notifier SET ?", [alert.user_id, alertRecord], (err, res) => {
                    let query_end3 = new Date().getTime();
                    counter_delete_alert_status.labels('notifier').inc(); // Increment by 1
                    gauge_delete_alert_status.labels('notifier').set(query_end3 - query_start3);
                    pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                        if (err) {
                            console.log(`Error: ${err}`);
                        }
                    });
                    if (err) {
                        //logger.error("Error from query in register process: " + newUser.email, { service: "Server" });
                        console.error("Error: ", err);
                        return;
                    }
                    console.info("INFO: Successfully delete alert record which is more than 1 hour and then send the new alert to the user")
                });
            } else {
                if (alert.alert_id == alertData.alert_id) {
                    let now = Date.now();
                    let update_difference = now - alertData.alert_updated;
                    if (update_difference >= 10000) {
                        let query_start4 = new Date().getTime();
                        mysql.query("UPDATE notifier SET status = ?, alert_updated = ?  WHERE user_id = ?", ["ALERT_IGNORED_DUPLICATE", Date.now(), alert.user_id], (err, res) => {
                            let query_end4 = new Date().getTime();
                            counter_update_alert_status.labels('notifier').inc(); // Increment by 1
                            gauge_update_alert_status.labels('notifier').set(query_end4 - query_start4);
                            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                                if (err) {
                                    console.log(`Error: ${err}`);
                                }
                            });
                            if (err) {
                                //logger.error("Error from query in register process: " + newUser.email, { service: "Server" });
                                console.error("Error: ", err);
                                return;
                            }
                            console.info("INFO: Already alert the same info in one hour!, ALERT_IGNORED_DUPLICATE")
                        });
                    }
                } else {
                    let now = Date.now();
                    let update_difference = now - alertData.alert_updated;
                    if (update_difference >= 10000) {
                        let query_start5 = new Date().getTime();
                        mysql.query("UPDATE notifier SET status = ?, alert_updated = ? WHERE user_id = ?", ["ALERT_IGNORED_TRESHOLD_REACHED", Date.now(), alert.user_id], (err, res) => {
                            let query_end5 = new Date().getTime();
                            counter_update_alert_status.labels('notifier').inc(); // Increment by 1
                            gauge_update_alert_status.labels('notifier').set(query_end5 - query_start5);
                            pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
                                if (err) {
                                    console.log(`Error: ${err}`);
                                }
                            });
                            if (err) {
                                //logger.error("Error from query in register process: " + newUser.email, { service: "Server" });
                                console.error("Error: ", err);
                                return;
                            }
                            console.info("INFO: Already alert the same user in one hour!, ALERT_IGNORED_TRESHOLD_REACHED")
                        });
                    }
                }
            }
            return;
        }
    });
}