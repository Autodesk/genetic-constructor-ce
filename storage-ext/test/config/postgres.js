"use strict";

var assert = require("assert");

describe("postgres configuration", function () {
  it("should return all required values", function () {
    var config = require('../../lib/config/postgres');
    assert(config.host != null);
    assert(config.port != null);
    assert(config.user != null);
    assert(config.password != null);
    assert(config.database != null);
  });
});