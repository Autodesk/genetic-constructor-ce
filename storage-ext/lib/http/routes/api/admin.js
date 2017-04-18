"use strict";

var async = require('async');

var extend = require('underscore').extend;
var pairs = require('underscore').pairs;
var reduce = require('underscore').reduce;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');

var Project = require('../../../project');
var Order = require('../../../order');
var Snapshot = require('../../../snapshot');

// these should be ordered for deletion by foreign dependencies
var orderedModels = {
  orders: Order,
  snapshots: Snapshot,
  projects: Project,
};

var deleteAllForOwner = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if ((! ownerUUID) || (ownerUUID == "")) {
    return res.status(400).send({
      message: 'failed to parse owner UUID from URI',
    }).end();
  }

  if (!uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: 'invalid owner UUID: ' + ownerUUID,
    }).end();
  }

  return async.mapSeries(pairs(orderedModels), function (modelPair, cb) {
    var modelName = modelPair[0];
    var model = modelPair[1];
    return model.destroy({
      where: {
        owner: ownerUUID,
      },
    }).then(function (numDeleted) {
      var result = {};
      result[modelName] = numDeleted;
      return cb(null, result);
    }).catch(cb);
  }, function (err, results) {
    if (err) {
      return res.status(500).send({
        message: err.message,
      }).end();
    }

    var mergedResult = reduce(results, function (memo, result) {
      return extend(memo, result);
    }, {});
    return res.status(200).send(mergedResult).end();
  });
};

var routes = [
  route('DELETE /owner/:ownerId', deleteAllForOwner),
];

module.exports = combiner.apply(null, routes);
module.exports.orderedModels = orderedModels;
