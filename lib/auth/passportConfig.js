const passport = require('passport');

const BearerStrategy = require('passport-http-bearer').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const LocalStrategy = require('passport-local').Strategy;

const repository = require('../repositories/authenticationRepository.js');
const errors = require('../utils/errors.json');
const successes = require('../utils/successes.json');

/**
 * Configure the Local Strategy (uses email and password to authenticate)
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 * @return {Object} information about the status of the request
 */
passport.use('local', new LocalStrategy({
        usernameField : "email",
        passReqToCallback: true
    },(req, email, password, done) => {

        repository.getUserforAuthentication(req, email, password, (user) => {
            return done(null, user);
        });
    }
));

/**
 * Configure another Local Strategy that first registers users
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 * @return {Object} information about the status of the request
 */
passport.use('local-signup', new LocalStrategy({
    usernameField : "email",
    passReqToCallback : true
},(req, email, password, done) => {

    if(req.body.password != req.body.passwordverification) return done(null, false, req.flash('errorMessage', errors.passwordsNotMatching ));

    repository.createUserforAuthentication(req, email, password, (user) => {
        if(user) {
            return done(null, user, req.flash('successMessage', successes.userAdded ));
        } else {
            return done(user);
        }
    });
}));

/**
 * Configure another Local Strategy that first changes a user;s password
 *
 * @param {Object} req This is the request object
 * @param {String} email This is the email of the user for which we are searching
 * @param {String} password This is the password to verify before fetching
 * @param {Object} done The callback used to pass the result
 * @return {Object} information about the status of the request
 */
passport.use('local-reset-password', new LocalStrategy({
    usernameField : "email",
    passReqToCallback : true
},
(req, email, password, done) => {

    if(req.body.password != req.body.passwordverification) return done(null, false, req.flash('errorMessage', errors.passwordsNotMatching ));

    repository.resetPasswordforAuthentication(req, email, password, (user) => {
        return done(null, user);
    });
}));

/**
 * Configure the Basic Strategy (uses Basic Auth, used in OAuth to verify clients)
 *
 * @param {String} clientId This is the Client ID for the client used
 * @param {String} clientSecret This is the Client Secret for the client used
 * @param {Object} done The callback used to pass the result
 * @return {Object} information about the status of the request
 */
passport.use(new BasicStrategy(
    (clientId, clientSecret, done) => {

        repository.getClientforAuthentication(clientId, clientSecret, (client) => {
            return done(null, client);
        });
    }
));

/**
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token). If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 *
 * @param {String} accessToken This is the token granted by the OAuth flow
 * @param {Object} done The callback used to pass the result
 * @return {Object} information about the status of the request
 */
passport.use(new BearerStrategy(
    (accessToken, done) => {

        repository.getTokenforAuthentication(accessToken, (entity) => {
            return done(null, entity);
        });
    }
));

/**
* Obtaining the user's authorization involves multiple request/response pairs.
* During this time, an OAuth 2.0 transaction will be serialized to the
* session. User serialization functions are registered to customize
* this process, which will typically be as simple as serializing
* the Email, and finding the Email when deserializing. This
* endpoint serializes the user
*
* @param {String} email This is the email of the user for which we are searching
* @param {Object} done The callback used to pass the result
* @return {Object} information about the status of the request
*/
passport.serializeUser(function(email, done) {
    return done(null, email);
});

/**
* Obtaining the user's authorization involves multiple request/response pairs.
* During this time, an OAuth 2.0 transaction will be serialized to the
* session. User serialization functions are registered to customize
* this process, which will typically be as simple as serializing
* the Email, and finding the Email when deserializing. This
* endpoint deserializes the user
*
* @param {String} email This is the email of the user for which we are searching
* @param {Object} done The callback used to pass the result
* @return {Object} information about the status of the request
*/
passport.deserializeUser((email, done) => {
    return done(null, email);
});