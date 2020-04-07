"use strict";

const passport = require('passport');

module.exports.get = [
    function(req, res) {
        res.render('reset_password', { 
            user_id: req.query.user_id, 
            token: req.query.reset_password_token, 
            message: req.flash('errorMessage')[0]
        });
    }
];

module.exports.post = [
    passport.authenticate('local-reset-password', {
        successReturnToOrRedirect: '/', 
        failureRedirect: '/reset-password',
        failureFlash: true
    })
];