'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('reset_password_tokens', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            user_id: Sequelize.INTEGER,
            token: Sequelize.STRING(300),
            expiration_date: Sequelize.DATE,
            is_used: Sequelize.BOOLEAN,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('reset_password_tokens');
    }
  }