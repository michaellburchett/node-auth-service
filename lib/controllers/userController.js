const passport = require('passport');

/**
 * An API endpoint that returns current user information
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 */
module.exports.get = [
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        res.json(req.user);
    }
];