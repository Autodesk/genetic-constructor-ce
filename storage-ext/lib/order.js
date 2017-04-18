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
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
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
  data: {
    type: Sequelize.JSONB,
    allowNull: false,
    defaultValue: {},
  },
};

var Order = DB.define('order', schema, {
  paranoid: false,
  indexes: [
    {
      fields: ['owner', 'id'],
      unique: true,
    },
    {
      fields: ['owner', 'projectId'],
    },
    {
      fields: ['projectId'],
    },
    {
      fields: ['owner'],
    },
  ],
});

module.exports = Order;
