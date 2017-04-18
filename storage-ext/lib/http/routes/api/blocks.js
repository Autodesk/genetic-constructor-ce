"use strict";

var async = require('async');

var objectPath = require("object-path");

var filter = require('underscore').filter;
var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;
var omit = require('underscore').omit;
var reduce = require('underscore').reduce;
var values = require('underscore').values;

var urlSafeBase64 = require('urlsafe-base64');
var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');

var Project = require('../../../project');

var FILTERS = {
  name: function (blocksArray, filterValue) {
    return filter(blocksArray, function (blockObj) {
      var val = objectPath.get(blockObj, 'metadata.name');
      return val && val.indexOf(filterValue) >= 0;
    });
  },
  role: function (blocksArray, filterValue) {
    return filter(blocksArray, function (blockObj) {
      var val = objectPath.get(blockObj, 'rules.role');

      if (filterValue === 'none') {
        return ((val == null) || (val == undefined));
      }

      return val && val.indexOf(filterValue) >= 0;
    });
  },
};

function applyBlockFilter(blocks, filterField, filterValue) {
  if (!filterField) {
    return blocks;
  }

  var filter = FILTERS[filterField];
  if (! filter) {
    console.error('unrecognized filter field:', filterField);
    return blocks;
  }

  return filter(blocks, filterValue);
}

function collapseBlocks(projectsArray, filterField, filterValue) {
  var groupedProjects = groupBy(map(projectsArray, function (row) {
    var projectJson = row.get();
    var matchingBlocks = applyBlockFilter(values(projectJson.data.blocks), filterField, filterValue);
    return {
      id: projectJson.id,
      version: projectJson.version,
      blocks: matchingBlocks,
    };
  }), function (project) {
    return project.id;
  });

  return reduce(pairs(groupedProjects), function (memo, pair) {
    return memo.concat(max(pair[1], function (projObj) {
      return projObj.version;
    }).blocks);
  }, []);
}

var fetchBlocksByName = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  // block names are the only parameters currently url-encoded
  var encodedBlockName = req.params.name;
  if ((! encodedBlockName) || (encodedBlockName == "")) {
    return res.status(400).send({
      message: 'failed to parse encoded block \'name\' from URI',
    }).end();
  }

  if (! urlSafeBase64.validate(encodedBlockName)) {
    return res.status(400).send({
      message: 'invalid encoded block \'name\'',
    }).end();
  }

  var blockName = urlSafeBase64.decode(encodedBlockName).toString('utf8');
  if ((!blockName) || (blockName == "")) {
    return res.status(400).send({
      message: 'decoding failure of encoded block \'name\'',
    }).end();
  }

  var where = {
    owner: ownerUUID,
    status: 1,
  };

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no blocks found for ' + JSON.stringify(where),
      }).end();
    }

    return res.status(200).send(collapseBlocks(results, 'name', blockName)).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchBlocksByRole = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  var blockRole = req.params.role;
  if ((! blockRole) || (blockRole == "")) {
    return res.status(400).send({
      message: 'failed to parse block \'role\' from URI',
    }).end();
  }

  var where = {
    owner: ownerUUID,
    status: 1,
  };

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no blocks found for ' + JSON.stringify(where),
      }).end();
    }

    return res.status(200).send(collapseBlocks(results, 'role', blockRole)).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectCountsByRole = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  var where = {
    owner: ownerUUID,
    status: 1,
  };

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no blocks found for ' + JSON.stringify(where),
      }).end();
    }

    var allBlocks = collapseBlocks(results);
    // console.log('reducing', allBlocks.length, 'blocks for role map');
    return res.status(200).send(reduce(allBlocks, function(memo, block) {
      var role = objectPath.get(block, 'rules.role');
      role = role || 'none';
      var currentCount = memo[role];
      if (! currentCount) {
        memo[role] = 1;
      } else {
        memo[role] = currentCount + 1;
      }

      return memo;
    }, {})).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var routes = [
  route('GET /name/:ownerId/:name', fetchBlocksByName),
  route('GET /role/:ownerId/:role', fetchBlocksByRole),
  route('GET /role/:ownerId', fetchProjectCountsByRole),
  route('GET /', function (req, res) {
    return res.status(501).end();
  }),
];

module.exports = combiner.apply(null, routes);
