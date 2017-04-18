"use strict";

var fs = require('fs');
var route = require('http-route');

var combiner = require('../combiner');
var packageJSON = require('../../../package.json');
var versionFilePath = __dirname + "/../../../VERSION";

var newLine = /\n/g;

function getVersion() {
  var version = packageJSON.version;
  try {
    version = fs.readFileSync(versionFilePath, {
      encoding: 'utf8',
    });
    if (version && (version != '')) {
      version = version.replace(newLine, '');
    }
  } catch (e) {
    if (e.code && e.code === 'ENOENT') {
      // do nothing
    } else {
      console.log("unexpected error loading version from", versionFilePath);
      console.log(e);
    }
  }

  return version;
}

var VERSION = getVersion();

function version(req, res) {
  res.statusCode = 200;
  res.send(VERSION);
  return res.end();
}

module.exports = combiner.apply(null, [
  route('GET /', version)
]);
