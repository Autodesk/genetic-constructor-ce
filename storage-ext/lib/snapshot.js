"use strict";

var Sequelize = require("sequelize");

var DB = require('./db');
var Project = require('./project');

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
  projectUUID: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: Project,
      key: 'uuid',
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE,
    },
  },
  projectId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  projectVersion: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false,
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
  tags: {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {},
  },
};

var Snapshot = DB.define('snapshot', schema, {
  paranoid: false,
  indexes: [
    {
      fields: ['projectId', 'projectVersion'],
      unique: true,
    },
    {
      fields: ['owner', 'projectId', 'projectVersion'],
      unique: true,
    },
    {
      fields: ['projectId'],
    },
    {
      fields: ['owner'],
    },
  ],
});

module.exports = Snapshot;
