const promclient = require('./promclient');
const pushgateway = new promclient.Pushgateway('http://pushgateway-prometheus-pushgateway.monitoring:9091/');

module.exports = pushgateway;