const mysql = require("mysql");
const dbconfig = require("./dbconfig.js");
//const logger = require("./winston.js");
const { findByEmail } = require("../services/userServices.js");

var connection = mysql.createPool({
  multipleStatements: true,
  host: dbconfig.HOST,
  user: dbconfig.USER,
  password: dbconfig.PASSWORD,
  database: dbconfig.DB
  //ssl: 'Amazon RDS'
});

var usertable = "CREATE TABLE IF NOT EXISTS `users` (" +
"`id` VARCHAR(36) NOT NULL," +
"`first_name` varchar(20) DEFAULT NULL," +
"`last_name` varchar(20) DEFAULT NULL," +
"`username` varchar(40) NOT NULL UNIQUE," +
"`password` binary(60) DEFAULT NULL," +
"`account_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," +
"`account_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
"PRIMARY KEY (`id`)" +
") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

var watchTable = "CREATE TABLE IF NOT EXISTS `watch` (" +
"`watch_id` VARCHAR(36) NOT NULL," +
"`user_id` VARCHAR(36) NOT NULL," +
"`watch_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," +
"`watch_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
"`zipcode` VARCHAR(6) NOT NULL," + 
"PRIMARY KEY (watch_id)," +
"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE" +
") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

var alertTable = "CREATE TABLE IF NOT EXISTS `alert` (" +
"`alert_id` VARCHAR(36) NOT NULL," +
"`watch_id` VARCHAR(36) NOT NULL," +
"`alert_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," +
"`alert_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
"`field_type` ENUM('temp', 'feels_like', 'temp_min', 'temp_max', 'pressure', 'humidity') NOT NULL," + 
"`operator` ENUM('gt', 'gte', 'eq', 'lt', 'lte') NOT NULL," + 
"`value` INT NOT NULL," +
"PRIMARY KEY (alert_id)," +
"FOREIGN KEY (watch_id) REFERENCES watch(watch_id) ON DELETE CASCADE ON UPDATE CASCADE" +
") ENGINE=InnoDB DEFAULT CHARSET=latin1;";

// connection.connect(function (err) {
//   if (err) throw err;
//   //logger.info("Successfully connected to the database", { service: "Database" });

  connection.query(usertable, function (err, result) {
    if (err) throw err;
    //logger.info("User Table created!", { service: "Database" });

    // Create the Watch table 
    connection.query(watchTable, function (err, result){
      if (err) throw err;

      // Create the Alert table 
      connection.query(alertTable, function (err, result){
        if (err) throw err;

      });
    });
  });
// });

module.exports = connection;