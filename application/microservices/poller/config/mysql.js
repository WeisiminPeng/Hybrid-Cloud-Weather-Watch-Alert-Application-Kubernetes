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

// var watchTable = "CREATE TABLE IF NOT EXISTS `poller_watch` (" +
// "`watch_id` VARCHAR(36) NOT NULL," +
// "`user_id` VARCHAR(36) NOT NULL," +
// "`watch_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," +
// "`watch_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
// "`zipcode` VARCHAR(6) NOT NULL," + 
// "PRIMARY KEY (watch_id)" +
// ") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

// var alertTable = "CREATE TABLE IF NOT EXISTS `poller_alert` (" +
// "`alert_id` VARCHAR(36) NOT NULL," +
// "`watch_id` VARCHAR(36) NOT NULL," +
// "`alert_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," +
// "`alert_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
// "`field_type` ENUM('temp', 'feels_like', 'temp_min', 'temp_max', 'pressure', 'humidity') NOT NULL," + 
// "`operator` ENUM('gt', 'gte', 'eq', 'lt', 'lte') NOT NULL," + 
// "`value` INT NOT NULL," +
// "PRIMARY KEY (alert_id)," +
// "FOREIGN KEY (watch_id) REFERENCES watch(watch_id) ON DELETE CASCADE ON UPDATE CASCADE" +
// ") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

var alertTable = "CREATE TABLE IF NOT EXISTS `poller_alert` (" +
"`alert_id` VARCHAR(36) NOT NULL," +
"`user_id` VARCHAR(36) NOT NULL," +
"`watch_id` VARCHAR(36) NOT NULL," +
"`zipcode` VARCHAR(6) NOT NULL," +
"`field_type` ENUM('temp', 'feels_like', 'temp_min', 'temp_max', 'pressure', 'humidity') NOT NULL," + 
"`operator` ENUM('gt', 'gte', 'eq', 'lt', 'lte') NOT NULL," + 
"`value` INT NOT NULL," +
"PRIMARY KEY (alert_id, user_id, watch_id)" +
") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

// connection.connect(function (err) {
  // if (err) throw err;
  //logger.info("Successfully connected to the database", { service: "Database" });


    // Create the alert table 
    connection.query(alertTable, function (err, result){
      if (err) throw err;
    });
// });

module.exports = connection;