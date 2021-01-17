'use strict';



module.exports = function(app){
    
    //Initialize routes
    let routes = require("./routes/routes");
    routes(app);
}