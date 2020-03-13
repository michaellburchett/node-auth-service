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
    .then(() => AccessToken.findOrCreate({where: {token: token}, defaults: {token: 'this'}}))
    .then(([token, created]) => {
        var accessToken = mapValues(token);

        callback(accessToken);
    })
};

module.exports.findByToken = function (token, callback) {
    AccessToken.findOne({where: {token: token}}).then(accessToken => {
        if(!accessToken) return null;
        var accessToken = mapValues(token);

        callback(accessToken);
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