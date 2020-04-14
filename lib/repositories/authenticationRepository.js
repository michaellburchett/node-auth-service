const User = require('../models/user.js');
const Client = require('../models/client.js');
const ResetPasswordToken = require('../models/reset_password_token.js');
const AccessToken = require('../models/access_token.js');
const errors = require('../utils/errors.json');

/**
 * Gets a user for the purpose of authorizing using Passport
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.getUserforAuthentication = function(req, email, password, done) {
    User.getByEmailandPassword(email, password, function(user) {
        if (!user) return done(null, false, req.flash('errorMessage', errors.missingEmail ));

        return done(user);
    });
}

/**
 * Creates a user or returns an error if one already exists for the purpose of authorizing using Passport
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.createUserforAuthentication = function(req, email, password, done) {
    User.getByEmail(email, function(user) {
        if(user) return done(null, false, req.flash('errorMessage', errors.takenEmail ));

        User.create(email, password, function(user) {
            if (!user) return done(null, false, req.flash('errorMessage', errors.generic ));
            return done(null, user);
        })
    });
}

/**
 * Uses a token to reset a password and logs user in
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.resetPasswordforAuthentication = function(req, email, password, done) {
    User.getByEmail(email, function(user) {
        if (!user) return done(null, false, req.flash('errorMessage', errors.missingEmail ));

        ResetPasswordToken.getByTokenAndUserId(req.body.token, req.body.user_id, async function(reset_password_token) {
            if(!reset_password_token) return done(null, false, req.flash('errorMessage', errors.invalidURL ));
            if(reset_password_token.is_used) return done(null, false, req.flash('errorMessage', errors.tokenUsed ));
            if(reset_password_token.expiration_date < Date.now()) return done(null, false, req.flash('errorMessage', errors.expiredEmail ));
            if(reset_password_token.is_used == true) return done(null, false, { message: errors.expiredEmail });
            User.updatePassword(user.id, password, function(user) {
                if(!user) return done(null, false, req.flash('errorMessage', errors.generic ));
                ResetPasswordToken.hasBeenUsed(reset_password_token.id, function(reset_password_token) {
                    if(!reset_password_token) return done(null, false, req.flash('errorMessage', errors.generic ));
                    return done(user);
                })
            })
        });
    });
}

/**
 * Gets a Client to log users in
 *
 * @param {String} clientId This is the ID of the Client
 * @param {String} clientSecret This is the Secret for the Client
 * @param {Object} done The callback used to pass the result
 */
module.exports.getClientforAuthentication = function(clientId, clientSecret, done) {
    Client.getByClientId(clientId, function(client) {
        if (!client) return done(null, false);
        if (client.clientSecret !== clientSecret) return done(null, false);
        return done(client);
    });
}

/**
 * Uses a Token to access site content
 *
 * @param {String} accessToken This access token distributed by the OAuth flow
 * @param {Object} done The callback used to pass the result
 */
module.exports.getTokenforAuthentication = function(accessToken, done) {
    AccessToken.findByToken(accessToken, function(token) {
        if (!token) return done(null, false, { message: errors.generic });
        if (token.expiration_date < Date.now()) return done(null, false, { message: errors.tokenExpired });
        if (token.user_id) {
            User.findById(token.user_id, function(user) {
              if (!user) return done(null, false);
              done(user, { scope: '*' });
            });
        } else {
            Client.getByClientId(token.client_id, function(client) {
              if (!client) return done(null, false);
              done(client, { scope: '*' });
            });
        }
    })
}