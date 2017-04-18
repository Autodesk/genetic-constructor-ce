"use strict";

var express = require("express");

var config = require('./config');
var log = require('./log');

module.exports = function () {
  var app = express();
  app.disable('x-powered-by');

  var uuid = require("uuid");
  app.use(function(req, res, next) {
    req.requestId = res.requestId = req.headers["x-request-id"] || uuid.v1();
    next();
  });

  app.use(function(req, res, next) {
    req.log = log.child({
      req: req,
      res: res,
    });
    next();
  });

  var logRequest = require("./log-request");
  app.use(function(req, res, next) {
    logRequest(req, res);
    next();
  });

  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  }));
  app.use(bodyParser.json({
    limit: '50mb',
  }));

  app.use(require('./http/routes'));

  return app;
};
