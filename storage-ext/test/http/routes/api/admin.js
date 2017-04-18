"use strict";

var assert = require("assert");
var async = require("async");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var each = require('underscore').each;
var pairs = require('underscore').pairs;

var orderedModels = require('../../../../lib/http/routes/api/admin').orderedModels;

var owner ='810ffb30-1938-11e6-a132-dd99bc746801';

describeAppTest("http", function (app) {
  describe('api admin routes', function () {
    this.timeout(15000);

    var projectId0 = "project-364d0c6a-6f08-4fff-a292-425ca3eb91cd";
    var orderId0 = '364d0c6a-6f08-45ff-a292-425ca3eb91cd';

    before(function(done) {
      async.waterfall([
        function (cb) {
          request(app.proxy)
            .post('/api/projects')
            .send({
              owner: owner,
              id: projectId0,
              data: {
                ah: "yeah",
              },
            })
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body.version, null);
              assert(res.body.version >= 0);
              return cb(err, res.body.version);
            });
        },
        function (version, cb) {
          request(app.proxy)
            .post('/api/snapshots')
            .send({
              owner: owner,
              projectId: projectId0,
              projectVersion: version,
              message: "test snapshot for admin user delete",
              type: "test",
              tags: {
                work: "hard",
              },
            })
            .expect(200)
            .end(function (err) {
              assert.ifError(err);
              return cb(err, version);
            });
        },
        function (version, cb) {
          request(app.proxy)
            .post('/api/orders')
            .send({
              owner: owner,
              id: orderId0,
              projectId: projectId0,
              projectVersion: version,
              type: "test",
              data: {
                foundry: "egf",
                dueDate: new Date(),
              },
            })
            .expect(200)
            .end(function (err) {
              assert.ifError(err);
              return cb(err);
            });
        },
      ], function (err) {
        assert.ifError(err);
        return done();
      });
    });

    it('should delete all data for an owner UUID', function deleteAllData(done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .delete('/api/admin/owner/' + owner)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              // console.log(res.body);
              each(pairs(orderedModels), function (modelPair) {
                assert.equal(res.body[modelPair[0]], 1);
              });
              cb(err);
            });
        },
        function (cb) {
          request(app.proxy)
            .head('/api/projects/owner/' + owner)
            .expect(404)
            .end(cb);
        },
        function (cb) {
          return async.eachSeries(pairs(orderedModels), function (modelPair, icb) {
            return modelPair[1].findAll({
              where: {
                owner: owner,
              }
            }).then(function (results) {
              assert.equal(results.length, 0);
              return icb();
            }).catch(icb);
          }, cb);
        },
      ], function (err) {
        assert.ifError(err);
        return done();
      });
    });
  });
});
