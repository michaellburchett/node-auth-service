"use strict";

const passport = require('passport');

module.exports.authenticate = [
    passport.authenticate('local', { 
        successReturnToOrRedirect: '/', 
        failureRedirect: '/login' 
    })
];

module.exports.show_login = [
    function(req, res) {
        res.render('login');
    }
];

module.exports.register = [
    passport.authenticate('local-signup', { 
        successReturnToOrRedirect: '/', 
        failureRedirect: '/register' 
    })
];

module.exports.show_register = [
    function(req, res) {
        res.render('register');
    }
];