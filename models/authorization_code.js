'use strict';

const AuthorizationCode = require('../db/authorization_code.js');

module.exports.create = function (
    code, 
    client_id, 
    redirectURI,
    ares_scope,
    user_id,
    callback
  ) { 
    AuthorizationCode.create({
      code: code,
      client_id: client_id,
      redirectURI: redirectURI,
      ares_scope: ares_scope,
      user_id: user_id
    })
    .then(() => AuthorizationCode.findOrCreate({where: {code: code}, defaults: {code: 'this'}}))
    .then(([code, created]) => {
        callback(code.dataValues.code);
    })
};

module.exports.findByCode = function (
  code,
  callback
) { 
  AuthorizationCode.findOne({where: {code: code}}).then(code => {
    if(!code) return null;

    var code = {
        id: code.dataValues.id,
        code: code.dataValues.code,
        client_id: code.dataValues.client_id,
        redirectURI: code.dataValues.redirectURI,
        ares_scope: code.dataValues.ares_scope,
        user_id: code.dataValues.user_id,
        created_at: code.dataValues.created_at,
    };
    callback(code);
  });
};