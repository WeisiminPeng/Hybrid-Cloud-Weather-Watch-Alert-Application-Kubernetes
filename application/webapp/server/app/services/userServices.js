'use strict';
const config = require('../config/config');
const mysql = require('../config/mysql.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//const //logger = require('../winston.js');
const sdc = require('../config/statsd.js');
const AWS = require('aws-sdk');
const uuid = require('uuid');
AWS.config.update({ region: 'us-east-1' });
const passwordStrength = require('check-password-strength');
const Validator = require('jsonschema').Validator;

const promclient = require('../config/promclient');
const pushgateway = require('../config/pushgateway');

const updateValidator = new Validator();
const updateSchema = {
  "properties": {
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "password": { "type": "string" },
    "username": { "type": "string" }
  },
  "additionalProperties": false
};

const User = function (params) {
  this.username = params.username;
  this.first_name = params.first_name;
  this.last_name = params.last_name;
  this.password = bcrypt.hashSync(params.password, 10);
}

// metrics
const gauge_insert_new_user = new promclient.Gauge({ name: 'mysql_insert_new_user', help: 'mysql_insert_new_user_help', labelNames: ['instance'] });
const counter_insert_new_user = new promclient.Counter({
  name: 'counter_mysql_insert_new_user',
  help: 'counter_mysql_insert_new_user_help',
  labelNames: ['instance'],
});

const gauge_fetch_user = new promclient.Gauge({ name: 'mysql_fetch_user', help: 'mysql_fetch_user_help', labelNames: ['instance'] });
const counter_fetch_user = new promclient.Counter({
  name: 'counter_mysql_fetch_user',
  help: 'counter_mysql_fetch_user_help',
  labelNames: ['instance'],
});

const gauge_update_user = new promclient.Gauge({ name: 'mysql_update_user', help: 'mysql_update_user_help', labelNames: ['instance'] });
const counter_update_user = new promclient.Counter({
  name: 'counter_mysql_update_user',
  help: 'counter_mysql_update_user_help',
  labelNames: ['instance'],
});


// Fetch one user without authentication
exports.findByID = function (id, result) {
  //let query_start = new Date().getTime();
  let query_start1 = new Date().getTime();
  mysql.query(`SELECT * FROM users WHERE id = "${id}"`, (err, res) => {
    counter_fetch_user.labels('webapp').inc(); // Increment by 1
    let query_end1 = new Date().getTime();
    gauge_fetch_user.labels('webapp').set(query_end1 - query_start1);
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

    if (res.length) {
      //logger.info("User successfully found " + res[0], { service: "Server" });
      let { password, ...userWithoutPassword} = res[0];
      console.info("INFO: User " + userWithoutPassword.username + " is queried without authorization.");
      result(null, userWithoutPassword);
      return;
    }
    //let query_end = new Date().getTime();
    //sdc.timing("Query-Get", query_end - query_start);
    //logger.info("User cannot be found" + params, { service: "Server" });

    // No matching user

    result({ status: 404, message: "No matching user!" }, null);
  });
};

exports.findSelf = function (req, result) {
  //let query_start = new Date().getTime();

  // Parse jwt token from authorization field
  let token = req.headers['authorization'].split(' ')[1];

  // Verify if the token is valid
  jwt.verify(token, config.secret, { issuer: config.hostname }, function (err, decoded) {
    if (err) {
      result({ status: 401, message: "Your token is invalid!" }, null);
      //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
      return;
    }
    else {
      let id = decoded.sub;

      // Fetch user information from users table
      let query_start2 = new Date().getTime();
      mysql.query(`SELECT * FROM users WHERE id = "${id}"`, (err, res) => {
        counter_fetch_user.labels('webapp').inc(); // Increment by 1
        let query_end2 = new Date().getTime();
        gauge_fetch_user.labels('webapp').set(query_end2 - query_start2);
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

        if (res.length) {
          //logger.info("User successfully found " + res[0], { service: "Server" });
          let { password, ...userWithoutPassword} = res[0];
          console.info("INFO: User " + userWithoutPassword.username + " is queried with authorization.");
          result(null, userWithoutPassword);
          return;
        }
        //let query_end = new Date().getTime();
        //sdc.timing("Query-Get", query_end - query_start);
        //logger.info("User cannot be found" + params, { service: "Server" });

        // No matching user
        result({ status: 404, message: "No matching user!" }, null);
      });

    }
  });
};

exports.register = function (params, result) {

  //Check for strong passwrod
  if (passwordStrength(params.password).id != 2) {
    result({ status: 400, message: "Password is too weak!" }, null);
    return;
  }

  // Insert user entry into the users table
  let newUser = new User(params);
  newUser.id = uuid.v4();
  let query_start3 = new Date().getTime();
  mysql.query("INSERT INTO users SET ?", newUser, (err, res) => {
    let query_end3 = new Date().getTime();

    counter_insert_new_user.labels('webapp').inc(); // Increment by 1
    // duration for insert new user
    gauge_insert_new_user.labels('webapp').set(query_end3 - query_start3);
    pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
      if (err) {
        console.log(`Error: ${err}`);
      }
    });
    if (err) {
      //logger.error("Error from query in register process: " + newUser.email, { service: "Server" });
      console.error("Error: ", err);
      result({status: 400, message: err.sqlMessage}, null);
      return;
    }
    // sdc.timing("Query-Insert", query_end - query_start);
    //logger.info("User successsfully created: " + newUser.email, { service: "Server" });

    //Fetch the inserted user
    let query_start4 = new Date().getTime();
    mysql.query(`SELECT * FROM users WHERE username = "${params.username}"`, (err, res) => {
      counter_fetch_user.labels('webapp').inc(); // Increment by 1
      let query_end4 = new Date().getTime();
      gauge_fetch_user.labels('webapp').set(query_end4 - query_start4);
      pushgateway.pushAdd({ jobName: process.env.HOSTNAME }, (err, resp, body) => {
        if (err) {
          console.log(`Error: ${err}`);
        }
      });
      if (err) {
        console.error("Error: ", err);
        result({status: 500, message: err.sqlMessage}, null);
        return;
      }
      let { password, ...userWithoutPassword} = res[0];
      console.info("INFO: User " + userWithoutPassword.username + " is created.");
      result(null, userWithoutPassword);
    });

  });
};

exports.authenticate = function (req, result) {
  //let query_start = new Date().getTime();

  // Parse username and password from authorization field
  let auth_base64 = req.headers['authorization'].split(' ')[1];
  let buff = new Buffer(auth_base64, 'base64').toString();
  let password = buff.split(":")[1];
  let username = buff.split(":")[0];

  // Try to get matching user from users table
  let query_start5 = new Date().getTime();
  mysql.query(`SELECT * FROM users WHERE username = "${username}"`, (err, res) => {
    counter_fetch_user.labels('webapp').inc(); // Increment by 1
    let query_end5 = new Date().getTime();
    gauge_fetch_user.labels('webapp').set(query_end5 - query_start5);
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

    //let query_end = new Date().getTime();
    //sdc.timing("Query-Get", query_end - query_start);

    if (res.length) {
      let user = res[0];
      if (user && bcrypt.compareSync(password, user.password.toString('utf8'))) {
        const { password, ...userWithoutHash } = user;

        // Prepare claims and generate token for future authentication
        var claims = {
          iss: config.hostname,
          sub: user.id,
        }
        const token = jwt.sign(claims, config.secret, { expiresIn: '30m' });

        console.info("INFO: User " + userWithoutHash.username + " is successfully authenticated.");
        result(null, { ...userWithoutHash, token });
        //logger.info("User successfully authenticated " + user.email, { service: "Server" });
        return;
      }
      else {
        result({ status: 401, message: "Your password is invalid!" }, null);
        //logger.info("User authentication failed due to password mismatch: " + user.email, { service: "Server" });
        return;
      }
    }

    // No matching user found
    result({ status: 404, message: "No matching account!" }, null);

    //logger.info("User authentication failed: No such user", { service: "Server" });
  });
};

exports.updateSelf = function (req, result) {

  // Parse jwt token from authorization field
  let token = req.headers['authorization'].split(' ')[1];

  // Verify if the token is valid
  jwt.verify(token, config.secret, { issuer: config.hostname }, function (err, decoded) {
    if (err) {
      console.error(err);
      result({ status: 401, message: "Your token is invalid!" }, null);
      //logger.info("User authentication failed due to invalid token: " + user.email, { service: "Server" });
      return;
    }
    else {
      let id = decoded.sub;

      // Fetch user information from users table
      let query_start6 = new Date().getTime();
      mysql.query(`SELECT * FROM users WHERE id = "${id}"`, (err, res) => {
        counter_fetch_user.labels('webapp').inc(); // Increment by 1
        let query_end6 = new Date().getTime();
        gauge_fetch_user.labels('webapp').set(query_end6 - query_start6);
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

        if (res.length) {
          //logger.info("User successfully found " + res[0], { service: "Server" });
          let authenticated_user = res[0];

          //Check if trying to udpate another user
          if (authenticated_user.username != req.body.username) {
            result({ status: 400, message: "You are not authorized to update other user" }, null);
            return;
          }
          else {
            // Check for illegal fields
            if (!updateValidator.validate(req.body, updateSchema).valid) {
              result({ status: 400, message: "Your update request contains illegal fields!" }, null);
              return;
            }
            else {
              // Updating the user now
              let query_start7 = new Date().getTime();
              mysql.query("UPDATE users SET password = ?, first_name = ?, last_name = ? WHERE username = ?",
                [bcrypt.hashSync(req.body.password, 10), req.body.first_name, req.body.last_name, req.body.username], (err, res) => {
                  counter_update_user.labels('webapp').inc(); // Increment by 1
                  let query_end7 = new Date().getTime();
                  gauge_update_user.labels('webapp').set(query_end7 - query_start7);
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
                  else{
                    console.info("INFO: User " + req.body.username + "is updated.");
                    result(null, {status: 204});
                    return;
                  }
                });
            }
          }
        }
        else
          // No matching user
          result({ status: 404, message: "No matching user!" }, null);
      });

    }
  });
};

// exports.reset_password = function (params, result) {
//   const email = params.email;
//   let query_start = new Date().getTime();
//   mysql.query(`SELECT * FROM users WHERE email = "${email}"`, (err, res) => {
//     if (err) {
//       //logger.error("Error from query in authentication process: " + email, { service: "Server" });
//       console.log("error: ", err);
//       result(err, null);
//       return;
//     }

//     let query_end = new Date().getTime();
//     sdc.timing("Query-Get", query_end - query_start);

//     if (res.length) {
//       let user = res[0];
//       //Public SNS message
//       var params = {
//         Message: user.email, /* required */
//         TopicArn: config.password_topic_arn
//       };

//       // Create promise and SNS service object
//       var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

//       // Handle promise's fulfilled/rejected states
//       publishTextPromise.then(
//         function (data) {
//           //logger.info(`Message sent to the topic ${params.TopicArn}`, { service: "Server" });
//           result(null, { message: "SNS message published for user: " + user.email });
//         }).catch(
//           function (err) {
//             //logger.error("Error publishing sns messages: " + user.email, { service: "Server" });
//             console.log("error: ", err);
//             result({ code: "Unknown" }, null);

//           });
//     }
//     else {
//       // not found Customer with the id
//       result({ code: "ER_USER_NOMATCH" }, null);
//       //logger.info("Reset password failed: No such user", { service: "Server" });
//     }
//   });
// }

// exports.testUpdate = function (params, result) {

//   mysql.query("UPDATE users SET firstname = ?, lastname = ? WHERE email = ?",
//     [params.firstname, params.lastname, params.email], (err, res) => {

//       if (err) {
//         console.log("error: ", err);
//         result(err, null);
//         return;
//       }

//       if (res.affectedRows == 0) {
//         // not found Customer with the id
//         result({ kind: "not_found" }, null);
//         return;
//       }

//       console.log(res);
//       result(null, res);
//     });
// };