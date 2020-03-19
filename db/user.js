'use strict';

const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});
  
class User extends Model {}
User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING
}, { 
    // don't forget to enable timestamps!
    timestamps: true,

    // I want createdAt to actually be called created_at
    createdAt: 'created_at',

    // I don't want updatedAt
    updatedAt: false,

    sequelize, 
    modelName: 'user' 
});

module.exports = User;