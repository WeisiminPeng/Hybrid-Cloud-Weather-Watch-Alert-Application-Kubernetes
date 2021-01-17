const StatsD = require('node-statsd');

const sdc = new StatsD({host: process.env.IP, port: 8125});

module.exports = sdc;