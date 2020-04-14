
const { DataTypes } = require('sequelize');
const Model = require('index.js')

class AccessToken extends Model {

    values() {
        return {
            token: DataTypes.STRING,
            client_id: DataTypes.INTEGER,
            expiration_date: DataTypes.DATE,
            user_id: {
                references: {
                  model: User,
                  key: 'id',
                }
            },
        }
    }

    fetch(id) {
        return parentFetch(id);
    }

    fetchByField(field, value) {

    }

    get() {
        return {
            id: this.id,
            token: this.token,
            client_id: this.client_id,
            expiration_date: this.expiration_date,
            user_id: this.user_id
        }
    }

    create(token, client_id, expiration_date, user_id) {

    }

    update(id) {

    }

    updateByField(field, value) {

    }

    delete(id) {

    }

    deleteByField(field, value) {

    }
}

module.exports = AccessToken;