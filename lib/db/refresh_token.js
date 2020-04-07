const User = require('./user.js');
const AccessToken = require('./access_token.js');

const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

class RefreshToken extends Model {}
RefreshToken.init({
    token: DataTypes.STRING,
    client_id: DataTypes.INTEGER,
    user_id: {
      type: Sequelize.INTEGER,
      references: {
        model: User,
        key: 'id',
      }
    },
    access_token_id: {
      type: Sequelize.INTEGER,
      references: {
        model: AccessToken,
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
    modelName: 'refresh_token' 
});

module.exports = RefreshToken;