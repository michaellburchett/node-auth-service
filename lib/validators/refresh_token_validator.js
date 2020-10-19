const RefreshToken = require('../models/refresh_token.js');
const errors = require('../utils/errors.json');

class RefreshTokenValidator {

    /**
    * For the purpose of handlig the communication of the token with users
    *
    * @param {RefreshToken} RefreshToken The token to be emailed
    */
    constructor(token) {
        this.token = token;
    }

    /**
    * Validates
    *
    * @return {Boolean} returns true if this is fully valid
    */
    validate() {
        if (!this.token) return this.missingFailure();
        return this.success();
    };

    success() {
        return {
            success: true,
        };
    }

    missingFailure() {
        return {
            success: false,
            message: errors.wrongClient
        };
    }
}

module.exports = RefreshTokenValidator;