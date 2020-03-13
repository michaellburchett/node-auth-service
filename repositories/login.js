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