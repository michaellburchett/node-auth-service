const User = require('../models/user.js');
const Client = require('../models/client.js');
const ResetPasswordToken = require('../models/reset_password_token.js');
const AccessToken = require('../models/access_token.js');
const AccessTokenOwnership = require('../models/access_token_ownership.js');
const RefreshToken = require('../models/refresh_token.js');
const errors = require('../utils/errors.json');

const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Gets a user for the purpose of authorizing using Passport
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.getUserforAuthentication = async function(req, email, password, done) {
    var user = await (new User).fetchByField("email", email);
    if (!user) return done(null, false, req.flash('errorMessage', errors.missingEmail ));

    if (!bcrypt.compareSync(password, user.password))
    {
        return done(null, false, req.flash('errorMessage', errors.passwordsNotMatching ));
    } 

    return done(user);
}

/**
 * Creates a user or returns an error if one already exists for the purpose of authorizing using Passport
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.createUserforAuthentication = async function(req, email, password, done) {
    var user = await (new User).fetchByField("email", email);
    if (user) return done(null, false, req.flash('errorMessage', errors.takenEmail ));

    var user = await (new User).create({
        email: email,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds))
    });
    if (!user) return done(null, false, req.flash('errorMessage', errors.generic ));

    return done(null, user);
}

/**
 * Uses a token to reset a password and logs user in
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 */
module.exports.resetPasswordforAuthentication = async function(req, email, password, done) {
    var user = await (new User).fetchByField("email", email);
    if (!user) return done(null, false, req.flash('errorMessage', errors.missingEmail ));

    var token = await (new ResetPasswordToken).fetchByField("token",req.body.token);
    if(!token) return done(null, false, req.flash('errorMessage', errors.invalidURL ));
    if(token.user_id != req.body.user_id) return done(null, false, req.flash('errorMessage', errors.invalidURL ));
    if(token.is_used) return done(null, false, req.flash('errorMessage', errors.tokenUsed ));
    if(token.expiration_date < Date.now()) return done(null, false, req.flash('errorMessage', errors.expiredEmail ));
    if(token.is_used == true) return done(null, false, { message: errors.expiredEmail });
    
    var user_updated = await (new User).update(user.id,"password",bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds)));
    if (!user_updated) return done(null, false, req.flash('errorMessage', errors.generic ));

    var token_updated = await (new ResetPasswordToken).update(token.id,"is_used",true);
    if (!token_updated) return done(null, false, req.flash('errorMessage', errors.generic ));
    
    return done(user);
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
module.exports.getTokenforAuthentication = async function(accessToken, done) {
    var token = await (new AccessToken).fetchByField("token",accessToken);
    if (!token) return done(null, false, { message: errors.generic });

    if (token.expiration_date < Date.now()) return done(null, false, { message: errors.tokenExpired });

    var ownership = await (new AccessTokenOwnership).fetchByField("access_token_id",token.id);
    if (!ownership) return done(null, false, { message: errors.generic });

    if (ownership.user_id) {
        var user = await (new User).fetch(ownership.user_id);
        if (!user) return done(null, false);
        done(user, { scope: '*' });
    } else {
        Client.getByClientId(ownership.client_id, function(client) {
          if (!client) return done(null, false);
          done(client, { scope: '*' });
        });
    };
}

/**
 * Remove all tokens for a user and log them out
 *
 * @param {Object} req This is the request object
 * @param {Object} done The callback used to pass the result
 */
module.exports.logout = async function(req, done) {
    var token = req.headers.authorization.split("Bearer ")[1];
    var accessToken = await (new AccessToken).fetchByField("token",token);
    if (!accessToken) return done(null, false, { message: errors.generic });

    await deleteUserTokens(accessToken);

    req.logout();
    req.session.destroy();
    return done("Logout Successful!");
}

/**
 * Remove all tokens for a user
 *
 * @param {AccessToken} accessToken This is the access token to remove, and all of it's children
 */
async function deleteUserTokens(accessToken) {
    await (new RefreshToken).deleteByField("access_token_id",accessToken.id);
    await (new AccessToken).delete(accessToken.id);
    await (new AccessTokenOwnership).deleteByField("access_token_id",accessToken.id);
}