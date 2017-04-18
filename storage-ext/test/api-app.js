"use strict";

var async = require("async");
var bouncy = require("bouncy");
var extend = require("underscore").extend;
var net = require("net");
var spawn = require("child_process").spawn;
var request = require("supertest");

var config = require('../lib/config');
var SERVER_PATH = __dirname + "/../lib/server.js";
var PORT = config.lookup("apiPort");

function spawnApp() {
  var child = spawn("node", [SERVER_PATH], {
    env: extend({}, process.env),
  });

  child.exit = function(callback) {
    if (child.killed) {
      return callback();
    }
    child.killed = true;
    child.kill("SIGTERM");
    child.on("exit", function() {
      callback();
    });
  };

  return child;
}

function closeServer(server, callback) {
  try {
    server.close(function() {
      callback();
    });
  }
  catch (err) {
    callback();
  }
}

function createProxyServer() {
  return bouncy(function(req, bounce) {
    bounce(net.connect({ port: PORT }));
  });
}

function startAppAndProxyServer() {
  var child = spawnApp();
  child.proxy = createProxyServer();
  var exit = child.exit.bind(child);
  var close = closeServer.bind(null, child.proxy);
  child.exit = function(callback) {
    async.parallel([
      exit,
      close,
    ], callback);
  };
  return child;
}

function waitForServerLoad(child, callback) {
  setTimeout(function() {
    request(child.proxy)
      .get("/")
      .expect(200)
      .end(callback);
  }, 2500);
}

var child = startAppAndProxyServer();
child.stdout.pipe(process.stdout, { end: false });
child.stderr.pipe(process.stderr, { end: false });

before(function(callback) {
  this.timeout(60000);
  waitForServerLoad(child, callback);
});

after(function(callback) {
  this.timeout(10000);
  child.exit(callback);
});

module.exports = function(name, fn) {
  describe(name, function() {
    fn.call(this, child);
  });
};