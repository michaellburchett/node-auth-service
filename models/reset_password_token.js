'use strict';

const ResetPasswordToken = require('../db/reset_password_token.js');

module.exports.create = async function (
    token,
    expiration_date,
    is_used,
    user_id,
    callback
  ) {
    await ResetPasswordToken.create({
        token: token,
        expiration_date: expiration_date,
        is_used: is_used,
        user_id: user_id
    })
    .then((reset_password_token) => {
        callback(reset_password_token.dataValues);
    })
};

module.exports.getByUserId = async function (user_id, callback) {
    const token = await ResetPasswordToken.findOne({where: {user_id: user_id}});
    if(!token) return callback(null, false, { message: 'Sorry, this Reset Password Token cannot be found' });
    callback(mapValues(token));
};

module.exports.getByTokenAndUserId = async function (reset_password_token, user_id, callback) {
    const token = await ResetPasswordToken.findOne({where: {token: reset_password_token, user_id: user_id}});
    if(!token) return callback(null, false, { message: 'Sorry, this Reset Password Token cannot be found' });
    callback(mapValues(token));
};

module.exports.hasBeenUsed = async function (id, callback) {
    const token = await ResetPasswordToken.findOne({where: {id: id}});
    if(!token) return callback(null, false, { message: 'Sorry, this Reset Password Token cannot be found' });
    token.is_used = true;
    await token.save();
    callback(mapValues(token));
};

module.exports.destroyByToken = async function (reset_password_token, callback) {
    const token = await ResetPasswordToken.findOne({where: {token: reset_password_token}});
    await token.destroy();
    callback(null, true, { message: 'Deleted' });
};

function mapValues(reset_password_token) {
    return {
        id: reset_password_token.dataValues.id,
        token: reset_password_token.dataValues.token,
        expiration_date: reset_password_token.dataValues.expiration_date,
        is_used: reset_password_token.dataValues.is_used,
    }
}