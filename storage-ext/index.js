"use strict";

var dbInit = require('./lib/db-init');


var mockReqLog = function (input) {
  return console.log(input);
};

mockReqLog.info = function (input) {
  return console.log(input);
};

mockReqLog.error = function (input) {
  return console.error(input);
};

module.exports = {
  routes: require('./lib/http/routes/api'),
  init: dbInit,
  mockReqLog: function(req, res, next) {
    req.log = mockReqLog;
    next();
  },
};
