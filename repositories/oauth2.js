
const login = require('connect-ensure-login');
const oauth2orize = require('oauth2orize');
const passport = require('passport');
const utils = require('../utils');
const expiration = require('../utils/expiration.js');
const AuthorizationCode = require('../models/authorization_code.js');
const AccessToken = require('../models/access_token.js');
const Client = require('../models/client.js');

//Call createServer() to create a new OAuth 2.0 server. This instance exposes middleware that will be mounted in routes, as well as configuration options.
var server = oauth2orize.createServer();

//A client must obtain permission from a user before it is issued an access token. This permission is known as a grant, the most common type of which is an authorization code.
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    const code = utils.getUid(16);
    AuthorizationCode.create(code, client.clientId, redirectURI, ares.scope, user.id, function(authorization_code) {
        if (!authorization_code) {
            return done(null, false, { message: 'Sorry, Something Went Wrong.' });
        }

        return done(null, authorization_code.code);
    })
}));

// Grant implicit authorization. The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a token, which is bound to these
// values.
server.grant(oauth2orize.grant.token((client, user, ares, done) => {
    const token = utils.getUid(256);

    var date = new Date();

    var expiration_date = expiration.setExpirationDate(date);
    AccessToken.create(token, expiration_date, user.id, client.clientId, function(accessToken) {
        if (!accessToken) {
            return done(null, false, { message: 'Sorry, Something Went Wrong.' });
        }

        return done(null, accessToken.token);
    })
}));

// Exchange authorization codes for access tokens. The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code. The issued access token response can include a refresh token and
// custom parameters by adding these to the `done()` call
server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) => {
    AuthorizationCode.findByCode(code, function(authCode) {
        if (!authCode) {
            return done(null, false, { message: 'Sorry, Something Went Wrong.' });
        }
        if (client.clientId !== authCode.client_id) return done(null, false);
        if (redirectUri !== authCode.redirectURI) return done(null, false);

        var expiration_date = expiration.setExpirationDate(authCode.created_at);

        const token = utils.getUid(256);
        AccessToken.create(token, expiration_date, authCode.user_id, authCode.client_id, function(accessToken) {
            if (!accessToken) {
                return done(null, false, { message: 'Sorry, Something Went Wrong.' });
            }

            var expires_in = expiration.getExpiresInSeconds(expiration_date);

            var json_token = {
                "token": accessToken.token,
                "expires_in": expires_in,
                "refresh_token": "QW434CCFF34r3cCFEcf"//TODO
            }

            return done(null, json_token);
        })
    })
}));
  

//When a client requests authorization, it will redirect the user to an authorization endpoint.
//The server must authenticate the user and obtain their permission.
module.exports.authorization = [
    login.ensureLoggedIn(),
    server.authorize(function(clientID, redirectURI, done) {

        Client.getByClientId(clientID, function(client) {
            if (!client) {
                return done(null, false);
            }
            if(clientID == client.clientId && redirectURI == client.redirectURI) {  
                return done(null, client, client.redirectURI);
            }
            return done(null, false, { message: 'Sorry, Something Went Wrong.' });
        });
    }),
    function(req, res) {
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
    }
];

//In this example, connect-ensure-login middleware is being used to make sure a user is authenticated before authorization proceeds.
//At that point, the application renders a dialog asking the user to grant access.
//The resulting form submission is processed using decision middleware.
module.exports.decision = [
    login.ensureLoggedIn(),
    server.decision()
];

// Token endpoint.
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens. Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request. Clients must
// authenticate when making requests to this endpoint.
module.exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler(),
];

//Obtaining the user's authorization involves multiple request/response pairs.
//During this time, an OAuth 2.0 transaction will be serialized to the session.
//Client serialization functions are registered to customize this process,
//which will typically be as simple as serializing the client ID, and finding the client by ID when deserializing.
server.serializeClient(function(client, done) {
    return done(null, client.id);
});
  
server.deserializeClient(function(id, done) {

    Client.getById(id, function(client) {
        if (!client) {
            return done(null, false);
        }
        return done(null, client);
    });
});