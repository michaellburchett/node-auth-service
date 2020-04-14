"use strict";

const passport = require('passport');

/**
 * Displays the page for users to reset their password
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.get = [
    function(req, res) {
        res.render('reset_password', { 
            user_id: req.query.user_id, 
            token: req.query.reset_password_token, 
            message: req.flash('errorMessage')[0]
        });
    }
];

/**
 * Resets the password or displays an error
 *
 */
module.exports.post = [
    passport.authenticate('local-reset-password', {
        successReturnToOrRedirect: '/', 
        failureRedirect: '/reset-password',
        failureFlash: true
    })
];