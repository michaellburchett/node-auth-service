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
        res.render('register', { 
            errorMessage: req.flash('errorMessage')[0], 
            successMessage: req.flash('successMessage')[0] 
        });
    }
];

/**
 * Creates a new account or displays an error message
 *
 */
module.exports.post = [
    passport.authenticate('local-signup', { 
        successReturnToOrRedirect: '/login',
        failureRedirect: '/register',
        failureFlash: true
    })
];