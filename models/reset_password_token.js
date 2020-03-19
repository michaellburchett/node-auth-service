'use strict';

const ResetPasswordToken = require('../db/reset_password_token.js');

module.exports.create = function (
    token,
    expiration_date,
    is_used,
    user_id,
    callback
  ) {
    ResetPasswordToken.create({
        token: token,
        expiration_date: expiration_date,
        is_used: is_used, 
        user_id: user_id
    })
    .then(() => ResetPasswordToken.findOrCreate({where: {token: token}, defaults: {token: 'this'}}))
    .then(([reset_password_token, created]) => {
        callback(reset_password_token.dataValues);
    })
};

module.exports.getByTokenAndUserId = async function (token, user_id, callback) {
    ResetPasswordToken.findOne({where: {token: token, user_id: user_id}}).then(reset_password_token => {
        if(!reset_password_token) return callback(null, false, { message: 'Incorrect information' });
        var reset_password_token = {
            id: reset_password_token.dataValues.id,
            token: reset_password_token.dataValues.token,
            expiration_date: reset_password_token.dataValues.expiration_date,
            is_used: reset_password_token.dataValues.is_used,
        };

        callback(reset_password_token);
    });
};

module.exports.hasBeenUsed = async function (id, callback) {
    ResetPasswordToken.findOne({where: {id: id}}).then(reset_password_token => {
        if(!reset_password_token) return callback(null, false, { message: 'Incorrect information' });

        reset_password_token.is_used = true;
        reset_password_token.save();

        var reset_password_token = {
            id: reset_password_token.dataValues.id,
            token: reset_password_token.dataValues.token,
            expiration_date: reset_password_token.dataValues.expiration_date,
            is_used: reset_password_token.dataValues.is_used,
        };

        callback(reset_password_token);
    });
};