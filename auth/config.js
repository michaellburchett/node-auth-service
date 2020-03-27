const User = require('../models/user.js');
const Client = require('../models/client.js');
const AccessToken = require('../models/access_token.js');
const ResetPasswordToken = require('../models/reset_password_token.js');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;

/**
 * Configure the Local Strategy (uses email and password to authenticate)
 *
 */
passport.use('local', new LocalStrategy({
        usernameField : "email"
    },(email, password, done) => {
        User.getByEmailandPassword(email, password, function(user) {
            if (!user) return done(null, false, { message: 'Incorrect email.' });

            return done(null, user);
        });
    }
));

/**
 * Register Users
 *
 */
passport.use('local-signup', new LocalStrategy({
    usernameField : "email",
    passReqToCallback : true
},
(req, email, password, done) => {
    if(req.body.password != req.body.passwordverification) return done(null, false, { message: 'Sorry, These passwords do not match.' })

    User.getByEmail(email, function(user) {
        if (!user) {
            User.create(email, password, function(user) {
                if (!user) return done(null, false, { message: 'Sorry, Something went wrong.' });
                return done(null, user);
            })
        } else {
            return done(null, false, { message: 'Sorry, A User with this Email already exists' });
        }
    });
}));

/**
 * Changes a user's password
 *
 */
passport.use('local-reset-password', new LocalStrategy({
    usernameField : "email",
    passReqToCallback : true
},
(req, email, password, done) => {
    if(req.body.password != req.body.passwordverification) return done(null, false, { message: 'Sorry, These passwords do not match.' });
    User.getByEmail(email, function(user) {
        if (!user) return done(null, false, { message: 'Sorry, This is not a valid email address.' });
        ResetPasswordToken.getByTokenAndUserId(req.body.token, user.id, async function(reset_password_token) {
            if (!reset_password_token) return done(null, false, { message: 'Sorry, This this is not a valid token.' });
            if(reset_password_token.expiration_date < Date.now()) return done(null, false, { message: 'Sorry, This request is expired. Please request a new email.' });
            if(reset_password_token.is_used == true) return done(null, false, { message: 'Sorry, This link has been used. Please request a new email.' });
            User.updatePassword(user.id, password, function(user) {
                if(!user) return done(null, false, { message: 'Sorry, Something went wrong' });
                ResetPasswordToken.hasBeenUsed(reset_password_token.id, function(reset_password_token) {
                    if(!reset_password_token) return done(null, false, { message: 'Sorry, Something went wrong' });
                    return done(null, user);
                })
            })
        });
    });
}));


//Configure the Basic Strategy (uses Basic Auth, used in OAuth to verify clients)
passport.use(new BasicStrategy(
    function verifyClient(clientId, clientSecret, done) {
        Client.getByClientId(clientId, function(client) {
            if (!client) return done(null, false);
            if (client.clientSecret !== clientSecret) return done(null, false);
            return done(null, client);
        });
    }
));


/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token). If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 * 
 * This doesn't need to be here if you are not PROTECTING a route via OAuth
 */
passport.use(new BearerStrategy(
    (accessToken, done) => {
        AccessToken.findByToken(accessToken, function(token) {
            if (!token) {
                return done(null, false, { message: 'Sorry, Something Went Wrong.' });
            }
            if (token.expiration_date < Date.now()) {
                return done(null, false, { message: 'Sorry, This token is expired and a new one is needed.' });
            }
            if (token.user_id) {
                User.findById(token.user_id, function(user) {
                  if (!user) return done(null, false);
                  // To keep this example simple, restricted scopes are not implemented,
                  // and this is just for illustrative purposes.
                  done(null, user, { scope: '*' });
                });
            } else {
                // The request came from a client only since userId is null,
                // therefore the client is passed back instead of a user.
                Client.getByClientId(token.client_id, function(client) {
                  if (!client) return done(null, false);
                  // To keep this example simple, restricted scopes are not implemented,
                  // and this is just for illustrative purposes.
                  done(null, client, { scope: '*' });
                });
            }
        })
    }
));


//Serialization and Deserialization of Users for Passport Use
passport.serializeUser(function(email, done) {
    return done(null, email);
});


passport.deserializeUser((email, done) => {
    return done(null, email);
});