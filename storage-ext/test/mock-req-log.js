"use strict";

var assert = require("assert");

var mockReqLog = require('../index').mockReqLog;

describe('mock request log object', function () {

  it('should info log for an unqualified call', function (done) {
    var req = {};
    var res = {};
    return mockReqLog(req, res, function () {
      assert.notEqual(req.log, null);
      req.log("test info #1");
      done();
    });
  });

  it('should info log for an info call', function (done) {
    var req = {};
    var res = {};
    return mockReqLog(req, res, function () {
      assert.notEqual(req.log, null);
      req.log.info("test info #2");
      done();
    });
  });

  it('should error log for an error call', function (done) {
    var req = {};
    var res = {};
    return mockReqLog(req, res, function () {
      assert.notEqual(req.log, null);
      req.log.error("test error #1");
      done();
    });
  });
});
