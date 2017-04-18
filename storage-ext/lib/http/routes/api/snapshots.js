"use strict";

var async = require('async');

var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;

var Sequelize = require('sequelize');
var Project = require('../../../project');
var Snapshot = require('../../../snapshot');

var fetchSnapshotByUUID = function (req, res) {
  var snapshotUUID = req.params.uuid;
  if (! snapshotUUID) {
    return res.status(400).send({
      message: 'failed to parse Snapshot \'uuid\' from URI',
    }).end();
  }

  if (! uuidValidate(snapshotUUID, 1)) {
    return res.status(400).send({
      message: 'UUID is invalid',
    }).end();
  }

  return Snapshot.findOne({
    where: {
      uuid: snapshotUUID,
      status: 1,
    },
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'snapshot [' + snapshotUUID + '] does not exist',
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

var fetchSnapshots = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse \'projectId\' for Snapshot from URI',
    }).end();
  }

  var where = {
    projectId: projectId,
    status: 1,
  };

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.projectVersion = version;
  }

  return Snapshot.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      var errMessage = 'no Snapshots matching projectId: ' + where.projectId;
      if (where.projectVersion != null) {
        errMessage += ' and version: ' + where.projectVersion;
      }
      return res.status(404).send({
        message: errMessage,
      }).end();
    }

    return res.status(200).send(map(results, function (result) { return result.get(); })).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var checkSnapshots = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse \'projectId\' for Snapshot from URI',
    }).end();
  }

  var where = {
    projectId: projectId,
    status: 1,
  };

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.projectVersion = version;
  }

  return Snapshot.findAll({
    where: where,
    attributes: [ // TODO some left here for easier debugging
      'uuid',
      'projectId',
      'projectVersion',
      'updatedAt'
    ],
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send().end();
    }

    var latest = max(results, function(result) {
      return new Date(result.get('updatedAt'));
    });

    res.set('Latest-Snapshot', latest.uuid);
    return res.status(200).send(map(results, function (result) { return result.get(); })).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var saveSnapshot = function (req, res) {
  var body = req.body;
  if (! body) {
    return res.status(400).send({
      message: 'request body required to save new project',
    }).end();
  }

  // console.log(req.body);
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

  if (! body.projectId) {
    return res.status(400).send({
      message: '\'projectId\' is required in request body',
    }).end();
  }

  if (body.type == null) {
    return res.status(400).send({
      message: '\'type\' is required in request body',
    }).end();
  }

  if (! body.message) {
    return res.status(400).send({
      message: '\'message\' is required in request body',
    }).end();
  }

  var tags = {};
  if (body.tags != null) {
    if (typeof body.tags != "object") {
      return res.status(400).send({
        message: '\'tags\' should be an object',
      }).end();
    }

    tags = body.tags;
  }

  // lookup the project UUID to save a strict reference to a project version
  // assume the snapshot hasn't been created, because that should be the normal use case
  // catch a unique constraint and then update

  async.waterfall([
    function (cb) {
      if (notNullAndPosInt(body.projectVersion)) {
        return cb(null, {
          version: body.projectVersion,
        });
      }

      return Project.findOne({
        where: {
          owner: body.owner,
          id: body.projectId,
          status: 1,
        },
        order: [
          ['version', 'DESC'],
        ],
        attributes: [
          'uuid',
          'version',
        ],
      }).then(function (result) {
        return cb(null, {
          uuid: result.get('uuid'),
          version: result.get('version'),
        });
      }).catch(function (err) {});
    },
    function (latest, cb) {
      if (latest.uuid != null) {
        return cb(null, latest);
      }

      return Project.findOne({
        where: {
          owner: body.owner,
          id: body.projectId,
          version: latest.version,
          status: 1,
        },
        attributes: [
          'uuid',
          'version',
        ],
      }).then(function (result) {
        if (! result) {
          return cb({
            status: 404,
            message: 'target project does not exist',
          });
        }
        return cb(null, {
          uuid: result.get('uuid'),
          version: result.get('version'),
        });
      }).catch(function (err) {
        return cb({
          status: 500,
          message: err.message,
          err: err,
        });
      });
    },
    function (latest, cb) {
      return Snapshot.create({
        owner: body.owner,
        projectUUID: latest.uuid,
        projectId: body.projectId,
        projectVersion: latest.version,
        type: body.type,
        message: body.message,
        tags: tags,
      }).then(function (newSnapshot) {
        return cb(null, newSnapshot.get());
      }).catch(Sequelize.UniqueConstraintError, function () {
        return Snapshot.update({
          type: body.type,
          message: body.message,
          tags: tags,
        }, {
          returning: true,
          fields: ['type', 'message', 'tags'],
          where: {
            owner: body.owner,
            projectId: body.projectId,
            projectVersion: latest.version,
          },
        }).then(function (results) {
          if (results[0] > 1) {
            return cb({
              status: 500,
              message: 'unexpectedly updated more than one snapshot',
            });
          }

          return cb(null, results[1][0].get());
        }).catch(function (err) {
          return cb({
            status: 500,
            message: err.message,
            err: err,
          });
        });
      }).catch(function (err) {
        return cb({
          status: 500,
          message: err.message,
          err: err,
        });
      });
    },
  ], function (err, result) {
    if (err) {
      if (err.err) {
        req.log.error(err);
      }
      return res.status(err.status).send({
        message: err.message,
      }).end();
    }

    return res.status(200).send(result).end();
  });
};

var fetchByTags = function (req, res) {
  var tagsBody = req.body;
  if (! tagsBody) {
    return res.status(400).send({
      message: 'post tags as request body'
    }).end();
  }

  if (isEmpty(tagsBody)) {
    return res.status(400).send({
      message: 'tags request body may not be empty'
    }).end();
  }

  // console.log('tags body', tagsBody);
  var where = {
    tags: tagsBody,
  };

  if ((req.query.project != null) && (req.query.project != "")) {
    where.projectId = req.query.project;
  }

  return Snapshot.findAll({
    where: where,
  }).then(function (results) {
    if(results.length < 1) {
      return res.status(404).send({
        message: 'no matching snapshots',
      }).end();
    }

    return res.status(200).send(map(results, function (result) { return result.get(); })).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var deleteByUUID = function (req, res) {
  var snapshotUUID = req.params.uuid;
  if (! snapshotUUID) {
    return res.status(400).send({
      message: 'failed to parse Snapshot \'uuid\' from URI',
    }).end();
  }

  if (! uuidValidate(snapshotUUID, 1)) {
    return res.status(400).send({
      message: 'UUID is invalid',
    }).end();
  }

  if ((req.query.destroy != null) && (req.query.destroy === "true")) {
    req.log.info('Destroying Snapshot:', snapshotUUID);

    return Snapshot.destroy({
      where: {
        uuid: snapshotUUID,
      },
    }).then(function (numDeleted) {
      if (numDeleted < 1) {
        return res.status(404).send({
          message: 'snapshot [' + snapshotUUID + '] does not exist',
        }).end();
      }

      return res.status(200).send({
        numDeleted: numDeleted,
      }).end();
    }).catch(function (err) {
      req.log.error(err);
      return res.status(500).send({
        message: err.message,
      }).end();
    });
  }

  return Snapshot.update({
    status: 0,
  }, {
    returning: false,
    where: {
      uuid: snapshotUUID,
    },
  }).then(function (results) {
    var numDeleted = results[0];
    if (numDeleted < 1) {
      return res.status(404).send({
        message: 'snapshot [' + snapshotUUID + '] does not exist',
      }).end();
    }

    return res.status(200).send({
      numDeleted: numDeleted,
    }).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var routes = [
  route('GET /:projectId', fetchSnapshots),
  route('HEAD /:projectId', checkSnapshots),
  route('GET /uuid/:uuid', fetchSnapshotByUUID),
  route('DELETE /uuid/:uuid', deleteByUUID),
  route('POST /tags', fetchByTags),
  route('POST /', saveSnapshot),
];

module.exports = combiner.apply(null, routes);
