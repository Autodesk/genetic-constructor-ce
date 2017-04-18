"use strict";

var Sequelize = require("sequelize");

module.exports = new Sequelize(require('./config/postgres').connectString, {
  logging: function () {
    if (process.env.LOG_DB) {
      console.log(arguments);
    }
  },
});
