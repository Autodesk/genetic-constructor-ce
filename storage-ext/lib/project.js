"use strict";

var assert = require("assert");
var async = require("async");
var Sequelize = require("sequelize");

var DB = require('./db');

var schema = {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  owner: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  version: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0, // first version
    validate: {
      min: 0,
    },
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1, // 0: deleted, 1: active
    validate: {
      min: 0,
      max: 1,
    }
  },
  data: {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {},
  },
};

var Project = DB.define('project', schema, {
  paranoid: false,
  indexes: [
    {
      fields: ['id', 'version'],
      unique: true,
    },
    {
      fields: ['owner', 'id', 'version'],
      unique: true,
    },
    {
      fields: ['id'],
    },
    {
      fields: ['owner'],
    },
  ],
});

// initialize the DB
var init = function(otherTables, callback) {
  otherTables = otherTables || [];
  assert(Array.isArray(otherTables));

  async.series([
    function (cb) {
      Project.sync().then(function () {
        cb(null);
      }).catch( function (e) {
        cb(e);
      });
    },
    function (cb) {
      async.mapSeries(otherTables, function (table, done) {
        table.sync().then(function () {
          done(null);
        }).catch(function (e) {
          done(e);
        });
      }, cb);
    },
  ], function (err) {
    callback(err);
  });
};

module.exports = Project;
module.exports.init = init;
