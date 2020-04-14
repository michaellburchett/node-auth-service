const oauth2orize = require('oauth2orize');

const expiration = require('../utils/expiration.js');
const errors = require('../utils/errors.json');
const utils = require('../utils');

const AuthorizationCode = require('../models/authorization_code.js');
const RefreshToken = require('../models/refresh_token.js');
const AccessToken = require('../models/access_token.js');
const Client = require('../models/client.js');

/**
 * Sets up the OAuth 2.0 Server for consumption by the app
 *
 * @param {Object} server This is the server provided by oauth2orize
 * @return {Object} information about the status of the request
 */
module.exports.setup = function(server) {

    /**
    * A client must obtain permission from a user before it is issued an 
    * access token. This permission is known as a grant, the most 
    * common type of which is an authorization code. This sets
    * up the authorization code grant.
    *
    * @param {Object} code This is oauth2orize.grant.code() provided by oauth2orize
    * @return {Object} information about the status of the request
    */
    server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
        const code = utils.getUid(16);
        AuthorizationCode.create(code, client.clientId, redirectURI, ares.scope, user.id, function(authorization_code) {
            if (!authorization_code) {
                return done(null, false, { message: errors.generic });
            }
    
            return done(null, authorization_code.code);
        })
     }))

    /**
    * Grant implicit authorization. The callback takes the `client` 
    * requesting authorization, the authenticated `user` granting 
    * access, and their response, which contains approved scope, 
    * duration, etc. as parsed by the application. The 
    * application issues a token, which is bound to 
    * these values.
    *
    * @param {Object} token This is oauth2orize.grant.token() provided by oauth2orize
    * @return {Object} information about the status of the request
    */
    server.grant(oauth2orize.grant.token((client, user, ares, done) => {
        const token = utils.getUid(256);
        const date = new Date();
        const expiration_date = expiration.setExpirationDate(date);
        AccessToken.create(token, expiration_date, user.id, client.clientId, function(accessToken) {
            if (!accessToken) {
                return done(null, false, { message: errors.generic });
            }

            return done(null, accessToken.token);
        })
    }));

    /**
    * Exchange authorization codes for access tokens. The callback accepts the `client`,
    * which is exchanging `code` and any `redirectUri` from the authorization request 
    * for verification. If these values are validated, the application issues an 
    * access token on behalf of the user who authorized the code. The issued 
    * access token response can include a refresh token and custom 
    * parameters by adding these to the `done()` call
    *
    * @param {Object} code This is oauth2orize.exchange.code() provided by oauth2orize
    * @return {Object} information about the status of the request
    */
    server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) => {
        AuthorizationCode.findByCode(code, function(authCode) {
            if (!authCode) return done(null, false, { message: errors.generic });
            if (client.clientId !== authCode.client_id) return done(null, false, { message: errors.generic });
            if (redirectUri !== authCode.redirectURI) return done(null, false, { message: errors.generic });

            generateAccessTokenAndRefreshToken(authCode.user_id, authCode.client_id, (json) => {
                return done(null, json);
            });
        })
    }));

    /**
    * Exchange refresh tokens for access tokens. The callback accepts the `client`,
    * which is exchanging `refreshToken` from the authorization request for 
    * verification. If these values are validated, the application issues 
    * an access token on behalf of the user who authorized the code.
    * The issued access token response can include a refresh token
    * and custom parameters by adding these to the `done()` call
    *
    * @param {Object} code This is oauth2orize.exchange.code() provided by oauth2orize
    * @return {Object} information about the status of the request
    */
    server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, done) => {
        RefreshToken.findByToken(refreshToken.token, (refreshToken) => {
            if (!refreshToken) return done(null, false, { message: errors.wrongToken });
            if (client.clientId !== refreshToken.client_id) return done(null, false, { message: errors.wrongClient });

            generateAccessTokenAndRefreshToken(refreshToken.user_id, client.clientId, (json) => {
                return done(null, json);
            });
        });
    }));

    /**
    * Obtaining the user's authorization involves multiple request/response pairs.
    * During this time, an OAuth 2.0 transaction will be serialized to the
    * session. Client serialization functions are registered to customize
    * this process, which will typically be as simple as serializing the
    * client ID, and finding the client by ID when deserializing. This
    * endpoint serializes the client
    *
    * @param {Object} callback This is the callback
    * @return {Object} information about the status of the request
    */
    server.serializeClient(function(client, done) {
        return done(null, client.id);
    });

    /**
    * Obtaining the user's authorization involves multiple request/response pairs.
    * During this time, an OAuth 2.0 transaction will be serialized to the
    * session. Client serialization functions are registered to customize
    * this process, which will typically be as simple as serializing the
    * client ID, and finding the client by ID when deserializing. This
    * endpoint deserializes the client
    *
    * @param {Object} callback This is the callback
    * @return {Object} information about the status of the request
    */
    server.deserializeClient(function(id, done) {

        Client.getById(id, function(client) {
            if (!client) {
                return done(null, false);
            }
            return done(null, client);
        });
    });
};

/**
 * Authenticates a Client
 *
 * @param {Object} server This is the server provided by oauth2orize
 * @return {Object} server.authorize() provided by oauth2orize
 */
module.exports.authenticateClient = function(server) {
    return server.authorize(function(clientID, redirectURI, callback) {
        Client.getByClientId(clientID, function(client) {
            if (!client) {
                return callback(null, false);
            }
            if(clientID == client.clientId && redirectURI == client.redirectURI) {  
                return callback(null, client, client.redirectURI);
            }
            return callback(null, false, { message: errors.generic });
        });
    })
};

/**
 * Generates both an Access Token and a Refresh Token and forms it into
 * a shape that the user can use
 *
 * @param {Int} user_id This is the id of the user asking for the tokens
 * @param {Int} client_id This is the id of the client asking for the tokens
 * @param {Object} done This is the callback
 * @return {Object} information about the status of the request
 */
function generateAccessTokenAndRefreshToken(user_id, client_id, done) {
    
    const expiration_date = expiration.setExpirationDate(new Date);
    const token = utils.getUid(256);

    AccessToken.create(token, expiration_date, user_id, client_id, function(accessToken) {
        if (!accessToken) return done(null, false, { message: errors.generic });

        const refresh_token = utils.getUid(256);

        RefreshToken.create(refresh_token, client_id, user_id, accessToken.id, function(refreshToken) {
            if (!refreshToken) return done(null, false, { message: errors.generic });

            const expires_in = expiration.getExpiresInSeconds(expiration_date);

            var json = {
                "token": accessToken.token,
                "expires_in": expires_in,
                "refresh_token": refreshToken.token
            }

            return done(json);
        })
    })
};