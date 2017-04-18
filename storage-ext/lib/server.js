"use strict";

var app = require('./app')();
var config = require('../lib/config');
var dbInit = require('./db-init');

var PORT = config.lookup("apiPort");
var httpServer = require("http").createServer(app);

function handleExit() {
  console.log("closing server");
  httpServer.close(function (err) {
    if (err) {
      console.log("error on server close:", err);
    }
    console.log("server process exiting");
    process.exit(0);
  });
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

// make sure the DB is ready
dbInit(function () {
  httpServer.listen(PORT, function () {
    console.log({
      address: httpServer.address()
    }, "started");
  });
});

module.exports = httpServer;
