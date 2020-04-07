const passport = require('passport');

module.exports.get = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        res.json(req.user);
    }
];