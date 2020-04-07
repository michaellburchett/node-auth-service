"use strict";

const repository = require('../repositories/forgotPassword.js');

/**
 * Retrieves the forgot password page, where users can submit an email to reset
 * their password
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.get = [
    function(req, res) {
        res.render('forgot_password', { message: req.flash('errorMessage')[0] });
    }
];

/**
 * Shows a page that indicates users have successfully sent the email to reset
 * their password
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.show_forgot_password_success = [
    function(req, res) {
        res.render('forgot_password_success', { message: req.flash('errorMessage')[0] });
    }
];

/**
 * Creates a reset password token and sends it to the user's email address
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.post = [
    function(req, res) {
        repository.generatePasswordTokenAndEmailIt(req, res, {
            success: 'forgot_password_success',
            failure: 'forgot_password'
        });
    }
];