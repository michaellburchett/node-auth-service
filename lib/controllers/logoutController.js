"use strict";

const repository = require('../repositories/authenticationRepository.js');

/**
 * Logs a user out or displays an error message
 *
 */
module.exports.post = [
    async function(req, res) {
        repository.logout(req, (message) => {
            res.json(message);
        });
    }
];