'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('access_token_ownerships', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            access_token_id: Sequelize.INTEGER,
            user_id: Sequelize.INTEGER,
            client_id: Sequelize.STRING(50),
            type: Sequelize.STRING(50),
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('access_token_ownerships');
    }
  }