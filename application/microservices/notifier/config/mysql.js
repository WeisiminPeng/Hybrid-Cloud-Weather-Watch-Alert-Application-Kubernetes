const mysql = require("mysql");
const dbconfig = require("./dbconfig.js");

var connection = mysql.createPool({
    multipleStatements: true,
    host: dbconfig.HOST,
    user: dbconfig.USER,
    password: dbconfig.PASSWORD,
    database: dbconfig.DB
    //ssl: 'Amazon RDS'
});

// connection.connect(function (err) {
    // if (err) throw err;

    var usertable = "CREATE TABLE IF NOT EXISTS `notifier` (" +
        "`user_id` VARCHAR(36) NOT NULL," +
        "`status` varchar(36) DEFAULT NULL," +
        "`alert_id` varchar(36) NOT NULL," +
        "`alert_created` long DEFAULT NULL," +
        "`alert_updated` long DEFAULT NULL," +
        "PRIMARY KEY (alert_id, user_id)" +
        ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"
    connection.query(usertable, function (err, result) {
        if (err) throw err;
    });
// });

module.exports = connection;