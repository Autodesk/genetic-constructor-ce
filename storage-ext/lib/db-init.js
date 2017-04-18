"use strict";

var init = require('./project').init;
module.exports = function (callback) {
  init([
    // insert other tables here
    require('./order'),
    require('./snapshot'),
  ], function (err) {
    if (err) {
      console.log("Failed to initialize Storage DB", err);
      process.exit(1)
    }
    return callback();
  });
};
