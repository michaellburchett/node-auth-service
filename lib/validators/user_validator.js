const Validator = require('./validator.js');
const User = require('../models/user.js');
const errors = require('../utils/errors.json');

const bcrypt = require('bcrypt');

class UserValidator extends Validator {

    /**
    * Validator
    *
    * @param {User} User The user to be validated
    */
    constructor(user, password) {
        super();
        this.user = user;
        this.password = password;
    }

    /**
    * Validates
    *
    * @return {JSONObject} returns a collection of information about the validity
    */
    validate() {
        if (!this.user) return this.missingFailure();
        if (!bcrypt.compareSync(this.password, this.user.password)) {
            this.passwordMatchingFailure();
        }
        return this.success();
    };

    success() {
        return this.parentSuccess();
    }

    missingFailure() {
        return this.parentFailure(errors.missingEmail);
    }

    passwordMatchingFailure() {
        return this.parentFailure(errors.passwordsNotMatching);
    }
}

module.exports = UserValidator;