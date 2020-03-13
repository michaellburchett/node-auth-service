'use strict';

module.exports.setExpirationDate = function(date) {

  date.setDate(date.getDate() + 90);

  return date;
};

module.exports.getExpiresInSeconds = function(expirationDate) {
  var difference = expirationDate - Date.now();

  var expiresInSeconds = Math.round(difference / 1000);

  return expiresInSeconds;
};


module.exports.isExpired = function(expiresInSeconds) {
  (expiresInSeconds > 0) ? false : true;
};