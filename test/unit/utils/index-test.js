'use strict';

let util = require('../../../lib/utils/index.js');
var assert = require('assert');

describe('Test Utilities in Index', function() {
  describe('getUid', function() {
    it('should return a random a Uid of a length given', function() {
      var uid = util.getUid(10);

      assert.equal(uid.length, 10);
    });
  });
});
