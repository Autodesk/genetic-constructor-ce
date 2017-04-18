"use strict";

var route = require("http-route");

var config = require('../../../config');
var combiner = require('../../combiner');

var routes = [
  route('/admin', require('./admin')),
  route('/blocks', require('./blocks')),
  route('/projects', require('./projects')),
  route('/orders', require('./orders')),
  route('/snapshots', require('./snapshots')),
  route('*', function (req, res) {
    return res.status(501).send('/api' + req.url + ' not found').end();
  }),
];

module.exports = combiner.apply(null, routes);
