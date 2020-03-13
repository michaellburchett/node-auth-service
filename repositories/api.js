const passport = require('passport');

module.exports.user_info = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        res.json(req.user);
    }
];