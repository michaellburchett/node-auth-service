'use strict';

let expiration = require('../../../lib/utils/expiration.js');
var assert = require('assert');

describe('Test Expiration Utilities', function() {
  describe('setExpirationDate', function() {
    it('should set an expiration date based on a date', function() {
      var date = new Date('August 19, 1975 23:15:30');
      var expectedExpirationDate = new Date('November 17, 1975 23:15:30');

      var expirationDate = expiration.setExpirationDate(date);

      assert.equal(expirationDate.toString(), expectedExpirationDate.toString());
    });
  });

  describe('getExpiresInSeconds', function() {
    it('should set an appropriate expires in seconds, given an expiration date', function() {
      var date = new Date();
      date.setDate(date.getDate() + 90);

      var expires_in_seconds = expiration.getExpiresInSeconds(date);

      assert.equal(expires_in_seconds, 7776000);
    });
  });

  describe('isExpired', function() {
    it('should return true if the seconds until expiration is less than or equal 0', function() {
      var is_expired = expiration.isExpired(1);

      assert(!is_expired);
    });
  });
});