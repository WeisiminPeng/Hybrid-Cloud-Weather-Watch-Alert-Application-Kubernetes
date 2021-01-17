'use strict';

const { watch } = require('fs');

module.exports = function(app){
    const userController = require('../controllers/userController');
    const watchController = require('../controllers/watchController');
    const appController = require('../controllers/appController');
    // const bookController = require('../controllers/bookController');
    // const cartController = require('../controllers/cartController');
    // const logController = require('../controllers/logController');

    /*************************
    ** User-related routing **
    **************************/
    app.route('/v1/user/self')
        .put(userController.update) // Update an User
        .get(userController.getSelf); // Fetch one user with authentication
        
    app.route('/v1/user/:id')
        .get(userController.search); //Fetch one user without authentication

    app.route('/v1/user/login')
        .post(userController.authenticate); // Log in an User

    app.route('/v1/user')
        .post(userController.registerUser); // Register a user

    /**************************
    ** Watch-related routing **
    ***************************/
    app.route('/v1/watch/:watch_id')
        .get(watchController.getByID) // Get a watch
        .put(watchController.update) // Update a watch
        .delete(watchController.delete); // Delete a watch

    app.route('/v1/watch')
        .post(watchController.create) // Create a new watch

    app.route('/v1/watches')
        .get(watchController.getAll) // Get all watches for the user

    /**************************
    ** Health and Liveness routing **
    ***************************/

    app.route('/ready')
        .get(appController.checkReadiness) // Get all watches for the user

    app.route('/live')
        .get(appController.checkLiveness) // Get all watches for the user

    
};