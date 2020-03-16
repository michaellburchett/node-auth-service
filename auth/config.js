const User = require('../models/user.js');
const Client = require('../models/client.js');
const AccessToken = require('../models/access_token.js');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;

//Configure the Local Strategy (uses username and password to authenticate)
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getByUsernameandPassword(username, password, function(user) {
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            return done(null, user);
        });
    }
));

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

/**
 * Register Users
 *
 */
passport.use('local-signup', new LocalStrategy({
        passReqToCallback : true
    },
    (req, username, password, done) => {
        if(req.body.password != req.body.passwordverification) return done(null, false, { message: 'Sorry, These passwords do not match.' });

        User.getByUsername(username, function(user) {
            if (user) return done(null, false, { message: 'Sorry, A user with this username already exists.' });
        });

        User.create(username, password, function(user) {
            if (!user) return done(null, false, { message: 'Sorry, Something went wrong.' });
            return done(null, user);
        })
    }
));


//Serialization and Deserialization of Users for Passport Use
passport.serializeUser(function(user, done) {
    return done(null, user);
});
  
passport.deserializeUser((user, done) => {
    return done(null, user);
});