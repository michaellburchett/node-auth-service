'use strict';

const User = require('../db/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.create = function (
    email, 
    password,
    callback
  ) {
    User.create({
        email: email,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds))
    })
    .then(() => User.findOrCreate({where: {email: email}, defaults: {email: 'this'}}))
    .then(([user, created]) => {
        callback(user.dataValues);
    })
};

module.exports.getByEmailandPassword = async function (email, password, callback) {
    User.findOne({where: {email: email}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect email' });
        if(!bcrypt.compareSync(password, user.dataValues.password)) return callback(null, false, { message: 'Incorrect Password' });

        var user = {
            id: user.dataValues.id,
            email: user.dataValues.email, 
            password: user.dataValues.password
        };

        callback(user);
        
    });
};
module.exports.getByEmail = async function (email, callback) {
    User.findOne({where: {email: email}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect email' });

        var user = {
            id: user.dataValues.id,
            email: user.dataValues.email, 
            password: user.dataValues.password
        };

        callback(user);
        
    });
};

module.exports.findById = function (id, callback) {
    User.findOne({where: {id: id}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect information' });

        var user = {
            id: user.dataValues.id,
            email: user.dataValues.email
        };

        callback(user);
    });
};

module.exports.updatePassword = function (id, password, callback) {
    User.findOne({where: {id: id}}).then(user => {
        if(!user) return callback(null, false, { message: 'Incorrect information' });

        user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));
        user.save();

        var user = {
            id: user.dataValues.id,
            email: user.dataValues.email
        };

        callback(user);
    });
};

module.exports.destroyByEmail = function (email, callback) {
    User.findOne({where: {email: email}}).then(async user => {
        if(!user) return callback(null, false, { message: 'Incorrect email' });
        await user.destroy();
        callback(null);
    });
};