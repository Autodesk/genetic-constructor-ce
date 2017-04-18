"use strict";

var loggerName = "user";
if (process.env.LOG_NAME != null) {
  loggerName = process.env.LOG_NAME;
}

var level = "info";
if (process.env.LOG_LEVEL != null) {
  level = process.env.LOG_LEVEL;
}

var disableSource = false;
if (process.env.LOG_NO_SOURCE != null) {
  disableSource = (process.env.LOG_NO_SOURCE.toLowerCase() === "true");
}

module.exports = {
  name: loggerName,
  level: level,
  src: !disableSource
};