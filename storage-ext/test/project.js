"use strict";

var assert = require("assert");
var async = require("async");

var Project = require('../lib/project');

var newProject = {
  owner: 'fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca',
  id: '531e80f0ec0a67bad4909ff063b3e8d6',
  data: {
    foo: "bar",
    test: ["bing", "bong", "bang"],
    app: {
      whiskey: ["tango", "foxtrot"],
      yes: "no",
      sure: {
        target: "test",
        origin: "back",
      },
      stats: [46, 88, 55, 101],
    }
  },
};

describe('project model', function () {
  before(function (done) {
    Project.sync().then(function () {
      done();
    });
  });

  it("should create a project", function (done) {
    async.series([
      function (cb) {
        Project.create(newProject).then(function () {
          cb(null);
        });
      },
      function (cb) {
        Project.findOne({
          where: {
            owner: newProject.owner,
            id: newProject.id,
          },
        }).then(function (project) {
          assert.notEqual(project, null);
          var projectRecord = project.get();
          assert.notEqual(projectRecord, null);
          // console.log("saved project:", projectRecord);
          assert.notEqual(projectRecord.uuid, null);
          assert.notEqual(projectRecord.version, null);
          assert.notEqual(projectRecord.createdAt, null);
          assert.notEqual(projectRecord.updatedAt, null);
          assert.equal(projectRecord.owner, newProject.owner);
          assert.equal(projectRecord.id, newProject.id);
          assert.deepEqual(projectRecord.data, newProject.data);
          cb(null);
        });
      },
    ], function (err) {
      assert.ifError(err);
      done();
    });
  });

  after(function (done) {
    Project.destroy({
      where: {
        owner: 'fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca',
      },
    }).then(function (count) {
      console.log("deleted " + count + " projects");
      done();
    });
  });
});