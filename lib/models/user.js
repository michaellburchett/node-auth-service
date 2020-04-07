'use strict';

const User = require('../db/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.create = async function (
    email, 
    password,
    callback
  ) {
    await User.create({
        email: email,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds))
    })
    .then((user) => {
        callback(mapValuesWithPassword(user));
    })
};

module.exports.getByEmailandPassword = async function (email, password, callback) {
    const user = await User.findOne({where: {email: email}});
    if(!user) return callback(null, false, { message: 'Sorry, this User cannot be found' });
    if(!bcrypt.compareSync(password, user.dataValues.password)) return callback(null, false, { message: 'Sorry, your Password is incorrect' });
    callback(mapValuesWithPassword(user));
};

module.exports.getByEmail = async function (email, callback) {
    const user = await User.findOne({where: {email: email}});
    if(!user) return callback(null, false, { message: 'Sorry, this User cannot be found' });
    callback(mapValuesWithPassword(user));
};

module.exports.findById = async function (id, callback) {
    const user = await User.findOne({where: {id: id}});
    if(!user) return callback(null, false, { message: 'Sorry, this User cannot be found' });
    callback(mapValues(user));
};

module.exports.updatePassword = async function (id, password, callback) {
    const user = await User.findOne({where: {id: id}});
    if(!user) return callback(null, false, { message: 'Sorry, this User cannot be found' });
    user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));
    await user.save();
    callback(mapValues(user));
};

module.exports.destroyByEmail = async function (email, callback) {
    const user = await User.findOne({where: {email: email}});
    await user.destroy();
    callback(null, true, { message: 'Deleted' });
};

function mapValues(user) {
    return {
        id: user.dataValues.id,
        email: user.dataValues.email
    }
}

function mapValuesWithPassword(user) {
    return {
        id: user.dataValues.id,
        email: user.dataValues.email,
        password: user.dataValues.password
    }
}