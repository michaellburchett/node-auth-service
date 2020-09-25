"use strict";

const passport = require('passport');

/**
 * Displays the Login page for users to log in
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.get = [
    function(req, res) {
        res.render('login', { errorMessage: req.flash('errorMessage')[0], successMessage: req.flash('successMessage')[0] });
    }
];

/**
 * Logs a user in or displays an error message
 *
 */
module.exports.post = [
    passport.authenticate('local', {
        successReturnToOrRedirect: '/', 
        failureRedirect: '/login',
        failureFlash: true
    })
];