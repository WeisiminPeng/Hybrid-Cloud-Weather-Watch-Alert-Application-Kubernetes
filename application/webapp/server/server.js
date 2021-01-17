/**
 * Use 'express' framework for developing endpoints
 * Use MySql as database
 * Use body-parser to interpret the requests
*/
let express = require('express'),
              app = express(),
              port = process.env.PORT || 3000, 
              bodyParser = require('body-parser');
              
//Adding body parser for handling request and response objects.
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


//Enabling CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Set public ip to environment variable
const publicIp = require('public-ip');

(async () => {
  console.log("config public ip: "+ await publicIp.v4());
  process.env.IP = await publicIp.v4();
})();

//Initialize app
let initApp = require('./app/app');
initApp(app);

app.listen(port);
console.log('Server RESTful API server started on: ' + port);