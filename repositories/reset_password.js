"use strict";

const passport = require('passport');
const User = require('../models/user.js');
const ResetPasswordToken = require('../models/reset_password_token.js');
const utils = require('../utils');
const expiration = require('../utils/expiration.js');
const emailer = require('../utils/emailer.js');

module.exports.show_forgot_password = [
    function(req, res) {
        res.render('forgot_password');
    }
];

module.exports.show_forgot_password_success = [
    function(req, res) {
        res.render('forgot_password_success');
    }
];

module.exports.forgot_password = [
    function(req, res) {
        User.getByEmail(req.body.email, function(user) {
            if (!user) res.render('forgot_password', {message: "Sorry, no user has been found with that email"});

            var date = new Date;

            const token = utils.getUid(256);
            const expiration_date = expiration.setPasswordResetExpirationDate(date);
            const is_used = false;

            ResetPasswordToken.create(token, expiration_date, is_used, user.id, function(resetPasswordToken) {
                if (!resetPasswordToken) return done(null, false, { message: 'Sorry, Something Went Wrong.' });
    
                emailer.transport(req.body.email, user.id, resetPasswordToken.token, (was_successful) => {
                    if(was_successful = true) {
                        res.render('forgot_password_success');
                    } else {
                        res.render('forgot_password', {message: "Sorry, Something went wrong"});
                    }
                });
            })
        });
    }
];

module.exports.show_reset_password = [
    function(req, res) {
        res.render('reset_password', { user_id: req.query.user_id, token: req.query.reset_password_token });
    }
];

module.exports.reset_password = [
    passport.authenticate('local-reset-password', { 
        successReturnToOrRedirect: '/', 
        failureRedirect: '/reset-password'
    })
];