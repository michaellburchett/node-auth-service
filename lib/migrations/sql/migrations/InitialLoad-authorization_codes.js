'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('authorization_codes', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            code: Sequelize.STRING(50),
            client_id: Sequelize.STRING(50),
            redirectURI: Sequelize.STRING(50),
            ares_scope: Sequelize.STRING(50),
            user_id: Sequelize.INTEGER,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('authorization_codes');
    }
  }