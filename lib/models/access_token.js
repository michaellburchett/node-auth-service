'use strict';

const AccessToken = require('../db/access_token.js');

module.exports.create = function (
    token,
    expiration_date,
    user_id,
    client_id,
    callback
  ) { 
    AccessToken.create({
        token: token,
        expiration_date: expiration_date,
        user_id: user_id,
        client_id: client_id,
    })
    .then(() => AccessToken.findOrCreate({where: {token: token}, defaults: {token: token}}))
    .then(([token, created]) => {
        callback(mapValues(token));
    })
};

module.exports.findByToken = function (token, callback) {
    AccessToken.findOne({where: {token: token}}).then(async accessToken => {
        if(!accessToken) return null;

        callback(mapValues(accessToken));
    });
};

module.exports.destroyByToken = async function (token, callback) {
    AccessToken.findOne({where: {token: token}}).then(accessToken => {
        if(!accessToken) return callback(null, false, { message: 'Incorrect Token' });
        accessToken.destroy();

        callback(null);
    });
};

function mapValues(token) {
    return {
        id: token.dataValues.id,
        token: token.dataValues.token,
        expiration_date: token.dataValues.expiration_date,
        user_id: token.dataValues.user_id, 
        client_id: token.dataValues.client_id,
        created_at: token.dataValues.created_at
    }
}