"use strict";

module.exports = {
  getConfig: function(config, key, defaultValue) {
    if (! config) {
      return defaultValue;
    }

    if (config[key] != null) {
      return config[key];
    }

    return defaultValue;
  },

  notNullOrEmpty: function (testStr) {
    if (! testStr) {
      return false;
    }

    if (typeof testStr !== "string") {
      return false;
    }

    return testStr !== "";
  },

  notNullAndPosInt: function (testInt) {
    if (testInt == null) {
      return false;
    }

    if (typeof testInt !== "number") {
      return false;
    }

    return testInt >= 0;
  }
};