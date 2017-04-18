"use strict";

var assert = require("assert");
var async = require("async");

var request = require("supertest");

var describeAppTest = require("../../api-app");

var versionRegEx = /^\d+\.\d+\.\d+$/;

describeAppTest("http", function (app) {
  describe("version routes", function () {
    it("should return a version", function (done) {
      request(app.proxy)
        .get('/version')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert(res);
          assert(res.text);
          assert(res.text.match(versionRegEx));
          done();
        });
    });
  });
});