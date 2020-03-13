'use strict';

const User = require('../db/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.getByUsername = async function (username, password, callback) { 
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

module.exports.findById = function (id, callback) { 
    User.findOne({where: {id: id}}).then(user => {
        if(!user) return null;

        var user = {
            id: user.dataValues.id,
            username: user.dataValues.username, 
            password: user.dataValues.password
        };

        callback(user);
    });
};

async function checkUser(passwordHash, password) {
    const match = await bcrypt.compare(password, passwordHash);
 
    if(match) {
        return true;
    }
}