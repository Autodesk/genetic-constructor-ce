#!/usr/bin/env node
"use strict";

var async = require("async");
var pg = require("pg");
var conString = require('../lib/config/postgres').connectString;

var config = require('../lib/config');
var RETRIES = config.lookup("dbConnRetries");
var WAIT = config.lookup("dbConnWait");

function testConnection (cb) {
  try {
    var client = new pg.Client(conString);
    client.on('error', function (err) {
      return cb(err);
    });
    client.connect(function (err) {
      if (err) {
        return cb(err);
      }

      //console.log("got client:", (client != null));
      client.end();
      return cb(null, (client != null));
    });
  } catch (e) {
    return cb(e);
  }
}

var exitValue = 1;
try {
  async.retry({
    times: RETRIES,
    interval: WAIT,
  }, testConnection, function (err, result) {
    if (err) {
      console.log("db connection failed:", err.message);
    }

    if (result) {
      console.log("db connection successful");
      exitValue = 0;
    }
    process.exit(exitValue);
  });
} catch (e) {
  console.log("caught exception while attempting to connect to db:", e);
  process.exit(1);
}

