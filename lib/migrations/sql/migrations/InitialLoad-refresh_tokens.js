'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('refresh_tokens2', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            token: Sequelize.STRING(300),
            client_id: Sequelize.STRING(50),
            user_id: Sequelize.INTEGER,
            access_token_id: Sequelize.INTEGER,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('refresh_tokens2');
    }
  }