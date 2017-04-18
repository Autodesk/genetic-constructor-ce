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
var Order = require('../../../order');

var fetchOrderByUUID = function (req, res) {
  var orderUUID = req.params.uuid;
  if (! orderUUID) {
    return res.status(400).send({
      message: 'failed to parse order \'uuid\' from URI',
    }).end();
  }

  if (! uuidValidate(orderUUID, 1)) {
    return res.status(400).send({
      message: 'UUID is invalid',
    }).end();
  }

  return Order.findOne({
    where: {
      uuid: orderUUID,
      status: 1,
    },
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'order [' + orderUUID + '] does not exist',
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

var fetchByOrderId = function (req, res) {
  var orderId = req.params.orderId;
  if ((! orderId) || (orderId == "")) {
    return res.status(400).send({
      message: 'failed to parse order \'orderId\' from URI',
    }).end();
  }

  var where = {
    id: orderId,
    status: 1,
  };

  if ((req.query.owner != null) && (! uuidValidate(req.query.owner, 1))) {
    return res.status(400).send({
      message: '\'owner\' UUID is invalid',
    }).end();
  }

  if (req.query.owner != null) {
    where.owner = req.query.owner;
  }

  return Order.findOne({
    where: where,
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'order [' + orderId + '] does not exist',
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

var checkByOrderId = function (req, res) {
  var orderId = req.params.orderId;
  if ((! orderId) || (orderId == "")) {
    return res.status(400).send({
      message: 'failed to parse order \'orderId\' from URI',
    }).end();
  }

  var where = {
    id: orderId,
    status: 1,
  };

  if ((req.query.owner != null) && (! uuidValidate(req.query.owner, 1))) {
    return res.status(400).send({
      message: '\'owner\' UUID is invalid',
    }).end();
  }

  if (req.query.owner != null) {
    where.owner = req.query.owner;
  }

  return Order.findOne({
    where: where,
  }).then(function (result) {
    if (! result) {
      return res.status(404).send().end();
    }

    res.set('Order-UUID', result.get('uuid'));
    return res.status(200).send().end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchOrders = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse \'projectId\' for order from URI',
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

  return Order.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      var errMessage = 'no orders matching projectId: ' + where.projectId;
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

var checkOrders = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse \'projectId\' for order from URI',
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

  return Order.findAll({
    where: where,
    attributes: [ // TODO some left here for easier debugging
      'uuid',
      'id',
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

    res.set('Latest-Order-Id', latest.id);
    res.set('Latest-Order-UUID', latest.uuid);
    return res.status(200).send(map(results, function (result) { return result.get(); })).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var saveOrder = function (req, res) {
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

  if (! body.id) {
    return res.status(400).send({
      message: 'unique order \'id\' is required in request body',
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

  if ((body.data == null) || (typeof body.data != "object")) {
     return res.status(400).send({
        message: '\'data\' object is required in request body',
      }).end();
  }

  // lookup the project UUID to save a strict reference to a project version
  // assume the order hasn't been created, because that should be the normal use case
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
      return Order.create({
        owner: body.owner,
        id: body.id,
        projectUUID: latest.uuid,
        projectId: body.projectId,
        projectVersion: latest.version,
        type: body.type,
        data: body.data,
      }).then(function (newOrder) {
        return cb(null, newOrder.get());
      }).catch(Sequelize.UniqueConstraintError, function () {
        return Order.update({
          type: body.type,
          data: body.data,
        }, {
          returning: true,
          fields: ['type', 'data'],
          where: {
            owner: body.owner,
            id: body.id,
          },
        }).then(function (results) {
          if (results[0] > 1) {
            return cb({
              status: 500,
              message: 'unexpectedly updated more than one order',
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

var deleteByUUID = function (req, res) {
  var orderUUID = req.params.uuid;
  if (! orderUUID) {
    return res.status(400).send({
      message: 'failed to parse order \'uuid\' from URI',
    }).end();
  }

  if (! uuidValidate(orderUUID, 1)) {
    return res.status(400).send({
      message: 'UUID is invalid',
    }).end();
  }

  // console.log("ORDER DELETE UUID", orderUUID);

  if ((req.query.destroy != null) && (req.query.destroy === "true")) {
    req.log.info('Destroying Order:', orderUUID);

    return Order.destroy({
      where: {
        uuid: orderUUID,
      },
    }).then(function (numDeleted) {
      if (numDeleted < 1) {
        return res.status(404).send({
          message: 'order [' + orderUUID + '] does not exist',
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

  return Order.update({
    status: 0,
  }, {
    returning: false,
    where: {
      uuid: orderUUID,
    },
  }).then(function (results) {
    var numDeleted = results[0];
    if (numDeleted < 1) {
      return res.status(404).send({
        message: 'order [' + orderUUID + '] does not exist',
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

var deleteByOrderId = function (req, res) {
  var orderId = req.params.orderId;
  if ((! orderId) || (orderId == "")) {
    return res.status(400).send({
      message: 'failed to parse order \'orderId\' from URI',
    }).end();
  }

  var where = {
    id: orderId,
  };

  if ((req.query.owner != null) && (! uuidValidate(req.query.owner, 1))) {
    return res.status(400).send({
      message: '\'owner\' UUID is invalid',
    }).end();
  }

  if (req.query.owner != null) {
    where.owner = req.query.owner;
  }

  // console.log("ORDER DELETE WHERE", where);

  if ((req.query.destroy != null) && (req.query.destroy === "true")) {
    req.log.info('Destroying Order:', orderId);

    return Order.destroy({
      where: where,
    }).then(function (numDeleted) {
      if (numDeleted < 1) {
        return res.status(404).send({
          message: 'order [' + orderId + '] does not exist',
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

  return Order.update({
    status: 0,
  }, {
    returning: false,
    where: where,
  }).then(function (results) {
    var numDeleted = results[0];
    if (numDeleted < 1) {
      return res.status(404).send({
        message: 'order [' + orderId + '] does not exist',
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
  route('GET /:projectId', fetchOrders),
  route('HEAD /:projectId', checkOrders),
  route('GET /id/:orderId', fetchByOrderId),
  route('HEAD /id/:orderId', checkByOrderId),
  route('DELETE /id/:orderId', deleteByOrderId),
  route('GET /uuid/:uuid', fetchOrderByUUID),
  route('DELETE /uuid/:uuid', deleteByUUID),
  route('POST /', saveOrder),
];

module.exports = combiner.apply(null, routes);
