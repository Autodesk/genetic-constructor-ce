"use strict";

var bunyan = require("bunyan");
var defined = require("defined");
var extend = require("underscore").extend;

var serializeReq = require("bunyan-express-serializer");

var LOGGER_CONFIG = require("./config/logger");

var serializers = extend({}, bunyan.stdSerializers, {
  req: function(req) {
    var obj = serializeReq(req) || {};
    return extend(obj, {
      requestId: req.requestId,
      uuid: req.user && req.user.uuid,
      remoteAddress: defined(req.ip, obj.remoteAddress),
      encrypted: defined(req.secure, req.connection && req.connection.encrypted),
    });
  },
  res: function(res) {
    var obj = bunyan.stdSerializers.res.apply(this, arguments);
    return extend(obj, {
      requestId: res.requestId,
    });
  }
});

function createLogger(name, props) {
  var log = bunyan.createLogger({
    name: name,
    level: LOGGER_CONFIG.level,
    src: LOGGER_CONFIG.src,
    stream: process.stdout,
    serializers: serializers,
  }).child(props, true);

  log.child = function(childName, props) {
    return createChildLogger(name, childName, props);
  };

  return log;
}

function createChildLogger(parentName, childName, props) {
  if (typeof childName === "object") {
    props = childName;
    childName = null;
  }

  if (childName != null) {
    childName = parentName + ":" + childName;
  }

  return createLogger(childName || parentName, props);
}

function insertReqLog(req, res, next) {
  req.log = createChildLogger("auth", {
    req: req,
    res: res,
  });
  next();
}

module.exports = createLogger(LOGGER_CONFIG.name);
module.exports.insertReqLog = insertReqLog;