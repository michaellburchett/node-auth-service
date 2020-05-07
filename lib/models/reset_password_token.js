
const AppModel = require('./index.js');

const User = require('./user.js')

class ResetPasswordToken extends AppModel {

    /**
    * The values that make up this entity and corresponding data types
    *
    * @return {Object} an object representing the values and data types
    */
    values() {
        return {
            token: "STRING",
            expiration_date: "DATE",
            is_used: "BOOLEAN",
            user_id: "INTEGER"
        }
    }

    /**
    * The relationships between this and other entities
    *
    * @return {Object} an object representing the relationships and foreign keys
    */
    relationships() {
        return {
            belongsTo: {
                user_id: User
            }
        }
    }

    /**
    * This can be left blank if there are none, but any area where the
    * data needs to be adjusted from the default values
    *
    * @return {Object} an object representing the data overrides
    */
    dataOverrides() {
        return {
            // timestamps: {
            //     createdAt: 'created_at',
            //     updatedAt: none
            // },
            databaseName: 'reset_password_token'
        }
    }

    /**
    * Fetch an entity by the id
    *
    * @param {Integer} id The id for the entity that we want to fetch
    * @return {Object} an object representing the entity
    */
    fetch(id) {
        return this.parentFetch(id);
    }

    /**
    * Fetch an entity by the field and value
    *
    * @param {String} field The field by which we would like to fetch the entity
    * @param {String} value The value that we expect for the field
    * @return {Object} an object representing the entity
    */
    fetchByField(field, value) {
        return this.parentFetchByField(field, value);
    }

    /**
    * Create an entity from given values in Object
    *
    * @param {Object} values A simple key-value pair Json object with values used to create
    * @return {Object} an object representing the entity
    */
    create(values) {
        return this.parentCreate(values);
    }

    /**
    * Update an entity of a specific id
    *
    * @param {Integer} id The id for the entity that we want to update
    * @param {String} field The field for the entity that we would like to update
    * @param {String} value The value to which we would like to update the field
    * @return {Object} an object representing the entity
    */
    update(id, field, value) {
        return this.parentUpdate(id, field, value);
    }

    /**
    * Update an entity by the field and value
    *
    * @param {String} searchField The field by which we would like to fetch the entity
    * @param {String} searchValue The value that we expect for the field
    * @param {String} updateField The field for the entity that we would like to update
    * @param {String} updateValue The value to which we would like to update the field
    * @return {Object} an object representing the entity
    */
    updateByField(searchField, searchValue, updateField, updateValue) {
        return this.parentUpdateByField(searchField, searchValue, updateField, updateValue);
    }

    /**
    * Delete an entity by the id
    *
    * @param {Integer} id The id for the entity that we want to delete
    * @return {Boolean} returns true if the entity was successfully deleted
    */
    delete(id) {
        return this.parentDelete(id);
    }

    /**
    * Delete an entity by the field and value
    *
    * @param {String} field The field by which we would like to delete the entity
    * @param {String} value The value that we expect for the field
    * @return {Boolean} returns true if the entity was successfully deleted
    */
    deleteByField(field, value) {
        return this.parentDeleteByField(field, value);
    }
}

module.exports = ResetPasswordToken;