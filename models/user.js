'use strict';

const User = require('../db/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.create = function (
    username, 
    password,
    callback
  ) {
    User.create({
        username: username,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds))
    })
    .then(() => User.findOrCreate({where: {username: username}, defaults: {username: 'this'}}))
    .then(([user, created]) => {
        callback(user.dataValues);
    })
};

module.exports.getByUsernameandPassword = async function (username, password, callback) {
    User.findOne({where: {username: username}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect Username' });
        if(!bcrypt.compareSync(password, user.dataValues.password)) return callback(null, false, { message: 'Incorrect Password' });

        var user = {
            id: user.dataValues.id,
            username: user.dataValues.username, 
            password: user.dataValues.password
        };

        callback(user);
        
    });
};
module.exports.getByUsername = async function (username, callback) {
    User.findOne({where: {username: username}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect Username' });

        var user = {
            id: user.dataValues.id,
            username: user.dataValues.username, 
            password: user.dataValues.password
        };

        callback(user);
        
    });
};

module.exports.findById = function (id, callback) {
    User.findOne({where: {id: id}}).then(user => {
        if(!user) return null;

        var user = {
            id: user.dataValues.id,
            username: user.dataValues.username
        };

        callback(user);
    });
};

module.exports.destroyByUsername = function (username, callback) {
    User.findOne({where: {username: username}}).then(async user => {
        if(!user) return callback(null, false, { message: 'Incorrect Username' });
        await user.destroy();
        callback(null);
    });
};