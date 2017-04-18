"use strict";

// this is the catch-all for configuration parameters that should ALWAYS have values

// defined process.env names here, usually shorter than camel-case names
var ENV_KEYS = {
  dbConnRetries: "RETRIES",
  dbConnWait: "WAIT",
  apiPort: "PORT",
};

var DEFAULTS = {
  dbConnRetries: 10,
  dbConnWait: 1000,
  apiPort: 4747,
};

module.exports = {
  envKeys: ENV_KEYS,
  defaults: DEFAULTS,
  lookup: function (key) {
    if((key != null) && (key != "")) {

      var envKey = ENV_KEYS[key];
      if (envKey == null) {
        throw new Error("invalid configuration key: " + key);
      }

      if ((envKey != null) && (process.env[envKey] != null)) {
        console.log("using environment variable", envKey, process.env[envKey]);
        return process.env[envKey];
      }

      return DEFAULTS[key];
    }
  },
};