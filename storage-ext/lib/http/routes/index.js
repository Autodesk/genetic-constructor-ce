"use strict";

var route = require("http-route");

var combiner = require('../combiner');

var routes = [
  route('/api', require('./api')),
  route('/version', require('./version')),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("Genetic Constructor REST Storage Server");
  })
];

module.exports = combiner.apply(null, routes);
