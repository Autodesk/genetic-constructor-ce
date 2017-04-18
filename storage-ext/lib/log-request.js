"use strict";

var onFinished = require("on-finished");
var log = require("./log").child("http");

module.exports = function logRequest(req, res) {
  var reqStartTime = Date.now();
  var reqFinishedTime = null;
  var reqLatency = null;
  var resEndTime = null;

  // Log start
  log.debug({
    req: req,
  }, "request");

  onFinished(req, function(err) {
    reqFinishedTime = Date.now();
    reqLatency = reqFinishedTime - reqStartTime;
    if (err) {
      log.error({
        err: err,
        req: req,
        res: res,
        reqLatency: reqLatency,
      }, "request error");
    }
  });

  var origResEnd = res.end;
  res.end = function() {
    resEndTime = Date.now();
    return origResEnd.apply(this, arguments);
  };

  // Log end
  onFinished(res, function(err) {
    var resFinishedTime = Date.now();
    var startTime = reqFinishedTime || reqStartTime;
    var endTime = resEndTime || resFinishedTime;
    var resLatency = resFinishedTime - resEndTime;
    var logData = {
      req: req,
      res: res,
      duration: endTime - startTime,
    };
    if (reqLatency != null && ! Number.isNaN(reqLatency)) {
      logData.reqLatency = reqLatency;
    }
    if (resLatency != null && ! Number.isNaN(resLatency)) {
      logData.resLatency = resLatency;
    }

    if (err) {
      logData.err = err;
      logData.body = req.body;
      log.error(logData, "response error");
    }
    else {
      log.info(logData, "response");
    }
  });
};