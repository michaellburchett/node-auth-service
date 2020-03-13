const User = require('./user.js');

const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

class AccessToken extends Model {}
AccessToken.init({
    token: DataTypes.STRING,
    client_id: DataTypes.INTEGER,
    expiration_date: DataTypes.DATE,
    user_id: {
      type: Sequelize.INTEGER,
      references: {
        model: User,
        key: 'id',
      }
    },
}, { 
    // don't forget to enable timestamps!
    timestamps: true,

    // I want createdAt to actually be called created_at
    createdAt: 'created_at',

    // I want updatedAt to actually be called updated_at
    updatedAt: 'updated_at',

    sequelize, 
    modelName: 'access_token' 
});

module.exports = AccessToken;