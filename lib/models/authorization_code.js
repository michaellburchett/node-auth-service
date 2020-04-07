'use strict';

const AuthorizationCode = require('../db/authorization_code.js');

module.exports.create = async function (
    code, 
    client_id, 
    redirectURI,
    ares_scope,
    user_id,
    callback
  ) { 
    await AuthorizationCode.create({
      code: code,
      client_id: client_id,
      redirectURI: redirectURI,
      ares_scope: ares_scope,
      user_id: user_id
    })
    .then((code) => {
      callback(mapValues(code));
    })
};

module.exports.findByCode = async function (
  code,
  callback
) { 
  AuthorizationCode.findOne({where: {code: code}}).then(code => {
    if(!code) return callback(null, false, { message: 'Incorrect information' });
    callback(mapValues(code));
  });
};

module.exports.destroyByCode = async function (code, callback) {
  AuthorizationCode.findOne({where: {code: code}}).then(async code => {
      if(!code) return callback(null, false, { message: 'Incorrect Code' });
      await code.destroy();
      await callback(true);
  });
};

function mapValues(code) {
  return {
    id: code.dataValues.id,
    code: code.dataValues.code,
    client_id: code.dataValues.client_id,
    redirectURI: code.dataValues.redirectURI,
    ares_scope: code.dataValues.ares_scope,
    user_id: code.dataValues.user_id,
    created_at: code.dataValues.created_at,
  }
}