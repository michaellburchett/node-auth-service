'use strict';

const RefreshToken = require('../db/refresh_token.js');

module.exports.create = async function (
    token, 
    client_id,
    user_id,
    access_token_id,
    callback
  ) { 
    await RefreshToken.create({
      token: token,
      client_id: client_id,
      user_id: user_id,
      access_token_id: access_token_id
    })
    .then((code) => {
      callback(mapValues(code));
    })
};

module.exports.findByToken = async function (
  token,
  callback
) { 
  RefreshToken.findOne({where: {token: token}}).then(token => {
    if(!token) return callback(null, false, { message: 'Incorrect information' });
    callback(mapValues(token));
  });
};

module.exports.destroyByToken = async function (token, callback) {
  RefreshToken.findOne({where: {token: token}}).then(async token => {
      if(!token) return callback(null, false, { message: 'Incorrect Token' });
      await token.destroy();
      await callback(true);
  });
};

function mapValues(code) {
  return {
    id: code.dataValues.id,
    token: code.dataValues.token,
    client_id: code.dataValues.client_id,
    user_id: code.dataValues.user_id,
    access_token_id: code.dataValues.access_token_id
  }
}