"use strict";

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var config = require('./config');
var PORT = config.lookup("apiPort");

var dbInit = require('./db-init');

if (cluster.isMaster) {
  // make sure the DB is ready
  dbInit(function () {
    // Fork workers
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
      cluster.fork();
    });
  });

} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  var app = require('./app')();
  app.listen(PORT, function () {
    console.log('Process ' + process.pid + ' is listening.');
  });
}
