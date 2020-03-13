'use strict';

const clients = require('../clients/default.json').Clients;

module.exports.getByClientId = function (clientId, callback) {

    var client = getByField("clientId", clientId);

    callback(client);
};

module.exports.getById = function (id, callback) { 
    
    var client = getByField("id", id);

    callback(client);
};

function getByField(fieldName, fieldValue) {
    var client = clients.filter(function(item) {
        if(item[fieldName] == fieldValue) return item;
    });

    client = client[0];

    return client;
}