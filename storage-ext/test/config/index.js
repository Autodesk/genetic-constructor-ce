"use strict";

var assert = require("assert");
var each = require("underscore").each;
var keys = require("underscore").keys;

var config = require('../../lib/config');

describe("configuration", function () {
  it("all defaults have environment variables defined", function () {
    each(keys(config.defaults), function (key) {
      assert.notEqual(config.envKeys[key], null, key + " is null");
    });
  });

  it("should throw an error for a missing key", function () {
    function lookupBlock() {
      return config.lookup("thisIsBadKey");
    }

    assert.throws(lookupBlock);
  });

  it("should return a default value", function () {
    assert.notEqual(config.lookup("apiPort"), null);
  });

  it("should return a non-default set by process.env", function () {
    process.env.RETRIES = 47;
    assert.equal(config.lookup("dbConnRetries"), 47);
  });
});