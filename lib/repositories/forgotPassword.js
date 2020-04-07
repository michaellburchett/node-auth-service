
const User = require('../models/user.js');
const ResetPasswordToken = require('../models/reset_password_token.js');
const utils = require('../utils');
const expiration = require('../utils/expiration.js');
const errors = require('../utils/errors.json');
const emailer = require('../utils/emailer.js');

/**
 * Creates a reset password token and sends it to the user's email address
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 * @param {Object} redirects Includes the 'success' and 'failure' redirect pages
 */
module.exports.generatePasswordTokenAndEmailIt = function(req, res, redirects) {
    getUserAndValidate(req, res, redirects, (user) => {
        createToken(req, res, redirects, user, (resetPasswordToken) => {
            emailUser(user, resetPasswordToken, (was_successful) => {
                if(was_successful) {
                    res.render(redirects.success);
                } else {
                    handleError(req, res, redirects.failure, errors.generic);
                }
            })
        })
    })
};

/**
 * Gets a user by Email and validates that the user exists based on given email
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 * @param {Object} redirects Includes the 'success' and 'failure' redirect pages
 * @param {Object} callback The callback used to pass the result
 */
function getUserAndValidate(req, res, redirects, callback) {
    User.getByEmail(req.body.email, function(user) {
        if(!user) {
            handleError(req, res, redirects.failure, errors.missingEmail);
        } else {
            callback(user);
        }
    });
};

/**
 * Creates a new token based on given user
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 * @param {Object} redirects Includes the 'success' and 'failure' redirect pages
 * @param {User} user The user object to be used to create a token
 * @param {Object} callback The callback used to pass the result
 */
function createToken(req, res, redirects, user, callback) {
    const token = utils.getUid(256);
    const expiration_date = expiration.setPasswordResetExpirationDate(new Date);
    const is_used = false;

    ResetPasswordToken.create(token, expiration_date, is_used, user.id, function(resetPasswordToken) {
        if(!resetPasswordToken) {
            handleError(req, res, redirects.failure, errors.missingEmail);
        } else {
            callback(resetPasswordToken);
        }
    });
};

/**
 * Emails a user a token
 *
 * @param {User} user The user to which to send the token
 * @param {ResetPasswordToken} resetPasswordToken The token to be emailed
 * @param {Object} callback The callback used to pass the result
 */
function emailUser(user, resetPasswordToken, callback) {
    emailer.transport(user.email, user.id, resetPasswordToken.token, (was_successful) => {
        if(was_successful) {
            callback(true);
        } else {
            callback(false);
        }
    });
};

/**
 * Logic for what to do to this page in the event of errors
 *
 * @param {Object} req This is the request object
 * @param {Object} res This is the response object
 * @param {String} page The page to be redirected to in case of event
 * @param {String} error The error message to be displayed in the case of this event
 */
function handleError(req, res, page, error) {
    req.flash('errorMessage', error);
    res.render(page, { message: req.flash('errorMessage')[0] });
};
