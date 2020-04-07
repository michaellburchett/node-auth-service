"use strict";

const passport = require('passport');

module.exports.authenticate = [
    passport.authenticate('local', {
        successReturnToOrRedirect: '/', 
        failureRedirect: '/login',
        failureFlash: true
    })
];

module.exports.show_login = [
    function(req, res) {
        res.render('login', { message: req.flash('errorMessage')[0] });
    }
];

module.exports.register = [
    passport.authenticate('local-signup', { 
        successReturnToOrRedirect: '/', 
        failureRedirect: '/register',
        failureFlash: true
    })
];

module.exports.show_register = [
    function(req, res) {
        res.render('register', { message: req.flash('errorMessage')[0] });
    }
];