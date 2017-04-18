#!/usr/bin/env node
"use strict";

var async = require('async');
var fs = require('fs');

var map = require('underscore').map;

var uuidValidate = require("uuid-validate");

// arguably this script should use the REST API
var dbInit = require('../lib/db-init');
var DB = require('../lib/db');
var Project = require('../lib/project');

var mostProjectsQuery = "select owner, numprojects from (select owner, count(uuid) as numprojects from projects group by owner order by numprojects desc) as foo limit 1;";

var ownerInput = null;

if((process.argv[2] != null) && (process.argv[2] != "")) {
  if (! uuidValidate(process.argv[2], 1)) {
    console.error("invalid owner id:", process.argv[2]);
    process.exit(1);
  }

  ownerInput = process.argv[2];
  console.log('Target Project Owner Specified at Command-line:', ownerInput);
}

function dumpProjects () {
  async.waterfall([
    function (cb) {
      if (ownerInput != null) {
        return cb(null, ownerInput);
      }

      return DB.query(mostProjectsQuery).spread(function (results, metadata) {
        if ((! results) || (! Array.isArray(results)) || (results.length != 1)) {
          return cb("unexpected result from most projects query");
        }

        // console.log("custom query results:", results);
        // console.log("custom query metadata:", metadata);

        console.log("User with most projects:", results[0].owner, "\tProject Count:", results[0].numprojects);
        return cb(null, results[0].owner);
      }).catch(cb);
    },
    function (targetOwner, cb) {
      if ((! targetOwner) || (targetOwner == "")) {
        return cb("null or empty target project owner");
      }

      return Project.findAll({
        where: {
          owner: targetOwner,
        }
      }).then(function (results) {
        if ((! results) || (results.length < 1)) {
          return cb("no projects found for target project owner: " + targetOwner);
        }

        return cb(null, {
          targetOwner: targetOwner,
          projectObjectArray: map(results, function (result) { return result.get(); }),
        });
      }).catch(cb);
    },
    function (inputs, cb) {
      if ((! inputs.targetOwner) || (inputs.targetOwner == "")) {
        return cb("null or empty target project owner");
      }

      if((! inputs.projectObjectArray) || (! Array.isArray(inputs.projectObjectArray)) ||
        (inputs.projectObjectArray.length < 1)) {
        return cb("no project objects to export");
      }

      console.log("Exporting Projects for Owner:", inputs.targetOwner);
      return fs.writeFile('gcprojects-' + inputs.targetOwner + '.json',
        JSON.stringify(inputs.projectObjectArray), 'utf8', function (err) {
          if (err) {
            return cb(err);
          }

          return cb(null, inputs.projectObjectArray.length);
        });
    },
  ], function (err, result) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    console.log("Projects Exported:", result);
    process.exit(1);
  });
}

return dbInit(dumpProjects);
