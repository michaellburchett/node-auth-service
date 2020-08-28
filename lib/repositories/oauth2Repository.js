const oauth2orize = require('oauth2orize');

const expiration = require('../utils/expiration.js');
const errors = require('../utils/errors.json');
const config = require("../config.json");
const utils = require('../utils');
const bcrypt = require('bcrypt');

const AuthorizationCode = require('../models/authorization_code.js');
const AccessTokenOwnership = require('../models/access_token_ownership.js');
const RefreshToken = require('../models/refresh_token.js');
const AccessToken = require('../models/access_token.js');
const Client = require('../models/client.js');
const User = require('../models/user.js');

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
   if(config.grantsAvailable.Authorization) {
      server.grant(oauth2orize.grant.code(async (client, redirectURI, user, ares, done) => {
        const code = utils.getUid(16);

        var authorizationCode = await (new AuthorizationCode).create({
            code: code,
            client_id: client.clientId,
            redirectURI: redirectURI,
            ares_scope: JSON.stringify(ares),
            user_id: user.id
        });
    
        if (!authorizationCode) return done( errors.generic );
    
        return done(null, authorizationCode.code);

    })) 
   }
    

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
    if(config.grantsAvailable.Implicit) {
        server.grant(oauth2orize.grant.token(async (client, user, ares, done) => {
            generateAccessTokenAndRefreshToken(user.id, client.clientId, null, "token", (json) => {
                return done(null, json.token);
            });
        }));
    }

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
    server.exchange(oauth2orize.exchange.code(async (client, code, redirectUri, done) => {
        var authCode = await (new AuthorizationCode).fetchByField("code",code);
        if (!authCode) return done(null, false, { message: errors.generic });
        if (client.clientId !== authCode.client_id) return done(null, false, { message: errors.generic });
        if (redirectUri !== authCode.redirectURI) return done(null, false, { message: errors.generic });
        generateAccessTokenAndRefreshToken(authCode.user_id, authCode.client_id, authCode.id, "authorization", (json) => {
            return done(null, json);
        });
    }));

    /**
     * Exchange the client id and password/secret for an access token.
     *
     * The callback accepts the `client`, which is exchanging the client's id and
     * password/secret from the token request for verification. If these values are validated, the
     * application issues an access token on behalf of the client who authorized the code.
     */
    if(config.grantsAvailable.ClientCredentials) {
        server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
            Client.getByClientId(client.clientId, function(clientmodel) {
                if (!clientmodel) {
                    return done(null, false, { message: errors.generic });
                }
                if(clientmodel.clientSecret !== clientmodel.clientSecret) {  
                    return done(null, false, { message: errors.generic });
                }

                generateAccessTokenAndRefreshToken(null, client.clientId, null, "client", (json) => {
                    return done(null, json);
                });
            });
        })); 
    }
    

    /**
     * Exchange a username and password for an access token.
     *
     * The callback accepts the `client`, `username`, and `password` which is exchanging the username
     * and password from the token request for verification. If these values are validated, the
     * application issues an access token on behalf of the client specified for the user.
     */
    if(config.grantsAvailable.UsernamePassword) {
        server.exchange(oauth2orize.exchange.password(async function (client, username, password, scope, done) {
            var user = await (new User).fetchByField("email",username);
            if (!user) return done(null, false, { message: errors.missingEmail });
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, { message: errors.passwordsNotMatching });
            }

            generateAccessTokenAndRefreshToken(user.id, client.clientId, null, "password", (json) => {
                return done(null, json);
            });
        }));
    }
    

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
    server.exchange(oauth2orize.exchange.refreshToken(async (client, refreshToken, done) => {
        var token = await (new RefreshToken).fetchByField("token",refreshToken.token);
        if (!token) return done(null, false, { message: errors.wrongToken });
        if (client.clientId !== refreshToken.client_id) return done(null, false, { message: errors.wrongClient });
        generateAccessTokenAndRefreshToken(refreshToken.user_id, client.clientId, null, "refresh_token", (json) => {
            return done(null, json);
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
async function generateAccessTokenAndRefreshToken(user_id, client_id, authorization_code_id, type, done) {

    const token = utils.getUid(256);
    const expiration_date = expiration.setExpirationDate(new Date);

    var accessToken = await (new AccessToken).create({
        token: token,
        expiration_date: expiration_date
    });
    if (!accessToken) return done(null, false, { message: errors.generic });

    var accessTokenOwnership = await (new AccessTokenOwnership).create({
        access_token_id: accessToken.id,
        user_id: user_id,
        client_id: client_id,
        authorization_code_id: authorization_code_id,
        type: type
    });

    if (!accessTokenOwnership) return done(null, false, { message: errors.generic });

    const refresh_token = utils.getUid(256);

    var refreshToken = await (new RefreshToken).create({
        token: refresh_token,
        client_id: client_id,
        user_id: user_id,
        access_token_id: accessToken.id
    });
    if (!refreshToken) return done(null, false, { message: errors.generic });

    const expires_in = expiration.getExpiresInSeconds(expiration_date);

    if(authorization_code_id) {
        var authorization_code = await (new AuthorizationCode).fetch(authorization_code_id);

        var json = {
            "token": accessToken.token,
            "expires_in": expires_in,
            "scope": authorization_code.ares_scope,
            "refresh_token": refreshToken.token
        }
    } else {
        var json = {
            "token": accessToken.token,
            "expires_in": expires_in,
            "refresh_token": refreshToken.token
        }
    }

    return done(json);
};