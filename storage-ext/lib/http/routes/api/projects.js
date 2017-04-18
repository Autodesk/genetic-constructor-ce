"use strict";

var async = require('async');

var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;
var omit = require('underscore').omit;
var reduce = require('underscore').reduce;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;

var Sequelize = require('sequelize');
var Project = require('../../../project');
var Order = require('../../../order');
var Snapshot = require('../../../snapshot');

function collapseProjects(projectsArray, dataFilterKeyArray) {
  dataFilterKeyArray = dataFilterKeyArray || [];
  var groupedProjects = groupBy(map(projectsArray, function (row) {
    var projectJson = row.get();
    projectJson.data = omit(projectJson.data, dataFilterKeyArray);
    return projectJson;
  }), function (project) {
    return project.id;
  });

  return map(pairs(groupedProjects), function (pair) {
    return max(pair[1], function (projObj) {
      return projObj.version;
    });
  });
}

var saveProject = function (req, res) {
  var body = req.body;
  if (! body) {
    return res.status(400).send({
      message: 'request body required to save new project',
    }).end();
  }

  if (! body.owner) {
    return res.status(400).send({
      message: '\'owner\' is required in request body',
    }).end();
  }

  if (! uuidValidate(body.owner, 1)) {
    return res.status(400).send({
      message: '\'owner\' UUID is invalid',
    }).end();
  }

  if (! body.id) {
    return res.status(400).send({
      message: '\'id\' is required in request body',
    }).end();
  }

  if ((! body.data) || isEmpty(body.data)) {
    return res.status(400).send({
      message: '\'data\' is required in request body',
    }).end();
  }

  var newRecord = {
    owner: body.owner,
    id: body.id,
    data: body.data,
  };

  if (notNullAndPosInt(body.version)) {
    newRecord.version = body.version;
  }

  return Project.create(newRecord).then(function (newProject) {
    return res.status(200).send(newProject.get()).end();
  }).catch(function (err) {
    console.log(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var updateProject = function (req, res) {
  var projectId = req.params.projectId;
  if (!projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  if (!req.body) {
    return res.status(400).send({
      message: 'no request body for updating project',
    }).end();
  }

  var data = req.body.data;
  if (!data) {
    return res.status(400).send({
      message: 'no data in request body for updating project',
    }).end();
  }

  var where = {
    id: projectId,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }
    where.owner = req.query.owner;
  }

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.version = version;
    req.log.info('update specific project version');

    return Project.update({
      data: data,
    }, {
      returning: true,
      fields: ['data'],
      where: where,
    }).then(function (results) {
      if (results[0] < 1) {
        return res.status(404).send({
          message: 'found no records to update',
          params: where,
        }).end();
      }

      if (results[0] > 1) {
        req.log.error('unexpectedly updated more than one record for:', where);
        return res.status(500).send({
          message: 'unexpectedly updated more than one record',
        }).end();
      }

      return res.status(200).send(results[1][0].get()).end();
    }).catch(function (err) {
      console.error(err);
      res.status(500).send({
        message: err.message,
      }).end();
    });
  }

  var overwrite = false;
  if ((req.query.overwrite != null) && (req.query.overwrite === "true")) {
    overwrite = true;
  }

  return async.waterfall([
    function (cb) {
      Project.findAll({
        where: where,
      }).then(function (rows) {
        return cb(null, max(rows, function (row) {
          return row.get('version');
        }));
      }).catch(cb);
    },
    function (record, cb) {
      if (! record) {
        return cb({
          nonDB: true,
          statusCode: 404,
          message: 'projectId ' + projectId + ' not found',
        });
      }

      if (overwrite) {
        record.set('data', data);
        return record.save({
          returning: true,
        }).then(function (updated) {
          return cb(null, updated.get());
        }).catch(cb);
      } else {
        return Project.create({
          owner: record.get('owner'),
          id: record.get('id'),
          data: data,
          version: (record.get('version') + 1),
        }).then(function (newProject) {
          return res.status(200).send(newProject.get()).end();
        }).catch(function (err) {
          console.log(err);
          return res.status(500).send({
            message: err.message,
          }).end();
        });
      }
    },
  ], function (err, result) {
    if (err) {
      if (err.nonDB) {
        return res.status(err.statusCode).send({
          message: err.message,
        }).end();
      }

      console.error(err);
      return res.status(500).send({
        message: err.message,
      }).end();
    }

    return res.status(200).send(result).end();
  });
};

var checkLatestProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.version = version;
  }

  return Project.findAll({
    where: where,
    attributes: [ // TODO not all of these are actually needed
      'uuid',
      'id',
      'owner',
      'createdAt',
      'updatedAt',
      'version',
      'status',
    ],
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send().end();
    }

    var latest = max(results, function (row) {
      return row.get('version');
    });
    res.set('Latest-Version-UUID', latest.get('uuid'));
    res.set('Latest-Version', latest.get('version'));
    res.set('Owner', latest.get('owner'));
    return res.status(200).send().end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send().end();
  });
};

var fetchLatestProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.version = version;
  }

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'projectId ' + projectId + ' does not exist',
      }).end();
    }

    var latest = max(results, function (row) {
      return row.get('version');
    });
    return res.status(200).send(latest.get()).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var optimizedFetchLatestProjectVersion = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findOne({
    where: where,
    order: [
      ['version', 'DESC'],
    ],
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'projectId ' + projectId + ' does not exist',
      }).end();
    }

    return res.status(200).send(result.get()).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjects = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  var dataFilterKeyArray = ['blocks'];
  if ((req.query.blocks != null) && (req.query.blocks === "true")) {
    dataFilterKeyArray = [];
  }

  return Project.findAll({
    where: {
      owner: ownerUUID,
      status: 1,
    }
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no projects found for owner: ' + ownerUUID,
      }).end();
    }

    return res.status(200).send(collapseProjects(results, dataFilterKeyArray)).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var checkProjects = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  return Project.findAll({
    where: {
      owner: ownerUUID,
      status: 1,
    },
    attributes: [
      'uuid',
      'id',
      'owner',
      'createdAt',
      'updatedAt',
      'version',
      'status',
    ],
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send().end();
    }

    var latest = max(results, function (result) {
      return new Date(result.get('updatedAt'));
    });

    res.set('Last-Project-UUID', latest.get('uuid'));
    res.set('Last-Project', latest.get('id'));
    return res.status(200).send().end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send().end();
  });
};

var optimizedFetchProjects = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  return res.status(501).send('coming soon').end();
};

var fetchProjectVersions = function (req, res) {
  var projectId = req.params.projectId;
  if (!projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findAll({
    where: where,
    attributes: [
      'uuid',
      'id',
      'owner',
      'createdAt',
      'updatedAt',
      'version',
      'status',
    ],
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no versions found for projectId: ' + projectId,
      }).end();
    }

    return res.status(200).send(map(results, function (result) { return result.get(); })).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var deleteProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var version = parseInt(req.query.version);
  var owner = null;
  if (notNullOrEmpty(req.query.owner)) {
    if (! uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }
    owner = req.query.owner;
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (owner != null) {
    where.owner = owner;
  }

  if (notNullAndPosInt(version)) {
    where.version = version;
  }

  return Project.update({
    status: 0,
  }, {
    returning: true,
    fields: ['status'],
    where: where,
  }).then(function (results) {
    if (results[0] < 1) {
      return res.status(404).send({
        message: 'found no records to update',
        params: where,
      }).end();
    }

    return async.map(results[1], function (result, done) {
      if (!result.uuid) {
        return done({
          message: 'update returning result missing \'uuid\'',
        });
      }

      var cascadeWhere = {
        projectUUID: result.uuid,
      };
      return async.parallel([
        function (cb) {
          // TODO call REST API here
          return Snapshot.update({
            status: 0,
          }, {
            returning: false,
            where: cascadeWhere,
          }).then(function (snapshotsDeleted) {
            var numDeleted = snapshotsDeleted[0];
            return cb(null, {
              numDeleted: numDeleted,
            });
          }).catch(function (err) {
            return cb({
              message: err.message,
            });
          });
        },
        function (cb) {
          // TODO call REST API here
          return Order.update({
            status: 0,
          }, {
            returning: false,
            where: cascadeWhere,
          }).then(function (ordersDeleted) {
            var numDeleted = ordersDeleted[0];
            return cb(null, {
              numDeleted: numDeleted,
            });
          }).catch(function (err) {
            return cb({
              message: err.message,
            });
          });
        },
      ], function (cascadeErr, cascadeResults) {
        return done(cascadeErr, {
          snapshots: cascadeResults[0],
          orders: cascadeResults[1],
        });
      });
    }, function (mapErr, mapResults) {

      var cascadeSums = reduce(mapResults, function (sums, mapResult) {
        return {
          snapshots: sums.snapshots + mapResult.snapshots.numDeleted,
          orders: sums.orders + mapResult.orders.numDeleted,
        };
      }, {
        snapshots: 0,
        orders: 0,
      });

      if ((where.version != null) && (results[0] > 1)) {
        req.log.error('unexpectedly deleted more than one record for:', where);
        return res.status(500).send({
          message: 'unexpectedly deleted more than one record',
          deleted: {
            projects: results[0],
            snapshots: cascadeSums.snapshots,
            orders: cascadeSums.orders,
          },
        }).end();
      }

      return res.status(200).send({
        projects: results[0],
        snapshots: cascadeSums.snapshots,
        orders: cascadeSums.orders,
      }).end();
    });
  }).catch(function (err) {
    req.log.error(err);
    res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectsWithBlock = function (req, res) {
  var blockId = req.params.blockId;
  if (! blockId) {
    return res.status(400).send({
      message: 'failed to parse blockId from URI',
    }).end();
  }

  var where = {
    status: 1,
    data: {
      '$contains': { project: { components: [ blockId ]} },
    },
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      var msg = 'no projects found with blockId: ' + blockId;
      if (where.owner != null) {
        msg = msg + ' and ownerId: ' + where.owner;
      }
      return res.status(404).send({
        message: msg,
      }).end();
    }

    return res.status(200).send(collapseProjects(results)).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectByUUID = function (req, res) {
  var projectUUID = req.params.uuid;
  if (!projectUUID) {
    return res.status(400).send({
      message: 'failed to parse uuid from URI',
    }).end();
  }

  return Project.findOne({
    where: {
      uuid: projectUUID,
    }
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'no projects found for UUID: ' + projectUUID,
      }).end();
    }

    return res.status(200).send(result.get()).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var optimizedCheckLatestProjectVersion = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findOne({
    where: where,
    order: [
      ['version', 'DESC'],
    ],
    attributes: [
      'uuid',
      'owner',
      'version',
    ],
  }).then(function (result) {
    if (! result) {
      return res.status(404).send().end();
    }

    res.set('Latest-Version-UUID', result.get('uuid'));
    res.set('Latest-Version', result.get('version'));
    res.set('Owner', result.get('owner'));
    return res.status(200).send().end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send().end();
  });
};

var routes = [
  route('GET /:projectId', fetchLatestProject),
  route('HEAD /:projectId', checkLatestProject),
  route('POST /:projectId', updateProject),
  route('DELETE /:projectId', deleteProject),
  route('GET /owner/:ownerId', fetchProjects),
  route('HEAD /owner/:ownerId', checkProjects),
  route('GET /block/:blockId', fetchProjectsWithBlock),
  route('GET /fast/project/:projectId', optimizedFetchLatestProjectVersion),
  route('HEAD /fast/project/:projectId', optimizedCheckLatestProjectVersion),
  route('GET /fast/owner/:ownerId', optimizedFetchProjects),
  route('GET /versions/:projectId', fetchProjectVersions),
  route('GET /uuid/:uuid', fetchProjectByUUID),
  route('POST /', saveProject),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("PROJECTS!");
  }),
];

module.exports = combiner.apply(null, routes);
