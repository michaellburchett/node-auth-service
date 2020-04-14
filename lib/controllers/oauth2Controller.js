"use strict";

const login = require('connect-ensure-login');
const oauth2orize = require('oauth2orize');
const passport = require('passport');

const repository = require('../repositories/oauth2Repository.js');

var server = oauth2orize.createServer();

repository.setup(server);

/**
 * When a client requests authorization, it will redirect the user to an authorization endpoint.
 * The server must authenticate the user and obtain their permission.
 *
 */
module.exports.authorize = [
    login.ensureLoggedIn(),
    repository.authenticateClient(server),
    function(req, res) {
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
    }
];

/**
 * Connect-ensure-login middleware is being used to make sure a user is authenticated
 * before authorization proceeds. At that point, the application renders a dialog
 * asking the user to grant access. The resulting form submission is processed
 * using decision middleware.
 *
 */
module.exports.decision = [
    login.ensureLoggedIn(),
    server.decision()
];

/**
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens. Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request. Clients
 * must authenticate when making requests to this endpoint.
 *
 */
module.exports.token = [
    passport.authenticate([
        'basic',
        'oauth2-client-password'
    ], { session: false }),
    server.token(),
    server.errorHandler(),
];