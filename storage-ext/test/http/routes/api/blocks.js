"use strict";

var assert = require("assert");
var async = require("async");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var objectPath = require("object-path");

var each = require('underscore').each;
var extend = require('underscore').extend;
var isEqual = require('underscore').isEqual;
var pairs = require('underscore').pairs;
var pick = require('underscore').pick;
var reduce = require('underscore').reduce;

var urlSafeBase64 = require('urlsafe-base64');
var uuidValidate = require("uuid-validate");

var Project = require('../../../../lib/project');

var InputData = require('../../../inputs/gcprojects-dc606c20-a085-11e6-9219-130ec77419b4.json');
var KeyedProjects = {};

describeAppTest("http", function (app) {
  describe('api block queries', function () {
    this.timeout(15000);

    var owner = null;

    before(function (done) {
      assert.notEqual(InputData, null);
      assert(Array.isArray(InputData));
      console.log("Loading", InputData.length, "for blocks tests.");
      async.reduce(InputData, null, function (lastOwner, nextProject, callback) {
        assert.notEqual(nextProject.owner, null);
        assert((lastOwner == null) || (lastOwner === nextProject.owner), "InputData Error: project owners don't match");
        owner = nextProject.owner; // setting this here helps with Project cleanup should `before` fail later
        KeyedProjects[nextProject.id] = nextProject;
        request(app.proxy)
          .post('/api/projects')
          .send(extend({}, pick(nextProject, ['owner', 'id', 'version', 'data'])))
          .expect(200)
          .end(function (err, res) {
            assert.ifError(err);
            assert.notEqual(res, null);
            assert.notEqual(res.body, null);
            assert.equal(res.body.owner, nextProject.owner);
            return callback(err, res.body.owner);
          });
      }, function (err, result) {
        assert.ifError(err);
        console.log('Projects loaded for owner:', result);
        done();
      });
    });

    after(function (done) {
      async.series([
        function (cb) {
          return Project.destroy({
            where: {
              owner: owner,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' projects');
            cb();
          }).catch(function (err) {
            console.error('project cleanup error', err);
            cb(err);
          });
        },
      ], function (err) {
        done(err);
      });
    });

    it('should fetch projects w/o blocks', function fetchWithoutBlock(done) {
      request(app.proxy)
        .get('/api/projects/owner/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, InputData.length);
          each(res.body, function (project) {
            assert.notEqual(project, null);
            assert.notEqual(project.data, null);
            var blocks = project.data.blocks;
            assert((blocks == null) || isEqual(blocks, {}));
          });
          done();
        });
    });

    it('should fetch projects w/ blocks', function fetchWithoutBlock(done) {
      request(app.proxy)
        .get('/api/projects/owner/' + owner + '?blocks=true')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, InputData.length);
          each(res.body, function (project) {
            assert.notEqual(project, null);
            assert.notEqual(project.data, null);
            var blocks = project.data.blocks;
            assert.notEqual(blocks, null);
            assert.notDeepEqual(blocks, {});
            assert.deepEqual(blocks, KeyedProjects[project.id].data.blocks);
          });
          done();
        });
    });

    it('should fetch blocks in projects by block name', function fetchBlocksByName(done) {
      var encodedName = urlSafeBase64.encode(Buffer.from('promoter', 'utf8'));
      request(app.proxy)
        .get('/api/blocks/name/' + owner + '/' + encodedName)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log(res.body);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, 4);
          var seenBlockIds = {};
          each(res.body, function (block) {
            assert.notEqual(block, null);
            assert.equal(seenBlockIds[block.id], null);
            seenBlockIds[block.id] = 1;
            assert.equal(objectPath.get(block, 'metadata.name'), 'promoter');
          });
          done();
        });
    });

    it('should fetch blocks in projects by block role', function fetchBlocksByRole(done) {
      request(app.proxy)
        .get('/api/blocks/role/' + owner + '/terminator')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log(res.body);
          assert(Array.isArray(res.body));
          // console.log(res.body.length);
          assert.equal(res.body.length, 4);
          var seenBlockIds = {};
          each(res.body, function (block) {
            assert.notEqual(block, null);
            assert.equal(seenBlockIds[block.id], null);
            seenBlockIds[block.id] = 1;
            assert.equal(objectPath.get(block, 'rules.role'), 'terminator');
          });
          done();
        });
    });

    it('should fetch a map of block counts by role', function fetchProjectCountsByRole(done) {
      request(app.proxy)
        .get('/api/blocks/role/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(typeof res.body, "object");
          each(pairs(res.body), function (roleCountPair) {
            assert.equal(typeof roleCountPair[0], "string");
            assert.equal(typeof roleCountPair[1], "number");
            if (roleCountPair[0] === "terminator") {
              assert.equal(roleCountPair[1], 4);
            } else if (roleCountPair[0] === "promoter") {
              assert.equal(roleCountPair[1], 4);
            } else if (roleCountPair[0] === "none") {
              assert.equal(roleCountPair[1], 28)
            } else {
              console.error('missing count test for block role:', roleCountPair[0]);
            }
          });
          done();
        });
    });

    it('should fetch blocks with \'null\' or \'undefined\' role', function fetchBlocksWithNoRole(done) {
      request(app.proxy)
        .get('/api/blocks/role/' + owner + '/none')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log(res.body);
          assert(Array.isArray(res.body));
          // console.log(res.body.length);
          assert.equal(res.body.length, 28);
          var seenBlockIds = {};
          each(res.body, function (block) {
            assert.notEqual(block, null);
            assert.equal(seenBlockIds[block.id], null);
            seenBlockIds[block.id] = 1;
            assert.equal(objectPath.get(block, 'rules.role'), null);
          });
          done();
        });
    });

    it('should get 501 for unsupported blocks route', function get501(done) {
      request(app.proxy)
        .get('/api/blocks')
        .expect(501)
        .end(function (err) {
          assert.ifError(err);
          done();
        });
    });
  });
});
