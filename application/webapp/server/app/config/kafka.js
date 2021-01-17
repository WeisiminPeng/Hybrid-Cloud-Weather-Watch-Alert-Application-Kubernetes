var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.KafkaClient({
        kafkaHost: process.env.KAFKAHOST
        //kafkaHost: 'localhost:9092'
    }),
    producer = new Producer(client);

producer.on('ready', function () {
    console.log('Backend Kafka Producer is ready!');
});

module.exports = producer;