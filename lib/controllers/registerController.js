"use strict";

const passport = require('passport');

/**
 * Displays the page for users to register a new account
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.get = [
    function(req, res) {
        res.render('register', { message: req.flash('errorMessage')[0] });
    }
];

/**
 * Creates a new account or displays an error message
 *
 */
module.exports.post = [
    passport.authenticate('local-signup', { 
        successReturnToOrRedirect: '/', 
        failureRedirect: '/register',
        failureFlash: true
    })
];