"use strict";

var assert = require("assert");
var async = require("async");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var each = require('underscore').each;

var Project = require('../../../../lib/project');
var Order = require('../../../../lib/order');
var Snapshot = require('../../../../lib/snapshot');

var owner = '810ffb30-1938-11e6-a132-dd99bc746800';

describeAppTest("http", function (app) {
  describe('api project routes', function () {
    this.timeout(15000);

    var projectId0 = 'b091da207742e81dae58257a323e3d3b';
    var projectId1 = 'project-364d0c6a-6f08-4fff-a292-425ca3eb91cc';
    var projectId2 = 'project-119fcdd0-a08c-11e6-9541-41074ff8626b';

    var projectUUID0 = null;
    var projectUUID1 = null;

    var orderId0 = '364d0c6a-6f08-4dff-a292-425ca3eb91cd';

    after(function (done) {
      async.series([
        function (cb) {
          return Order.destroy({
            where: {
              owner: owner,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' orders');
            cb();
          }).catch(function (err) {
            console.error('orders cleanup error', err);
            cb(err);
          });
        },
        function (cb) {
          return Snapshot.destroy({
            where: {
              owner: owner,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' snapshots');
            cb();
          }).catch(function (err) {
            console.error('snapshots cleanup error', err);
            cb(err);
          });
        },
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

    it('should confirm user has no projects', function testNoProjects(done) {
      request(app.proxy)
        .head('/api/projects/owner/' + owner)
        .expect(404)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          done();
        });
    });

    it('should confirm project does not exist', function testProjectExistsNot(done) {
      request(app.proxy)
        .head('/api/projects/'+ projectId0 + '?owner=' + owner)
        .expect(404)
        .end(function (err, res) {
          assert.ifError(err);
          done();
        });
    });

    it('should save a new project', function saveNewProject(done) {

      var data = {
        chicago: 'blackhawks',
      };

      request(app.proxy)
        .post('/api/projects')
        .send({
          owner: owner,
          id: projectId0,
          data: data,
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('save res:', res.body);
          assert.notEqual(res.body.uuid, null);
          projectUUID0 = res.body.uuid;
          assert.equal(res.body.owner, owner);
          assert.equal(res.body.version, 0);
          assert.equal(res.body.status, 1);
          assert.equal(res.body.id, projectId0);
          assert.deepEqual(res.body.data, data);
          assert.notEqual(res.body.createdAt, null);
          assert.notEqual(res.body.updatedAt, null);
          done();
        });
    });

    it('should confirm project exists', function testProjectExists(done) {
      request(app.proxy)
        .head('/api/projects/'+ projectId0 + '?owner=' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          var latestVersion = res.get('Latest-Version');
          assert.equal(latestVersion, 0);
          var latestVersionUUID = res.get('Latest-Version-UUID');
          assert.equal(latestVersionUUID, projectUUID0);
          var retrievedOwner = res.get('Owner');
          assert.equal(owner, retrievedOwner);
          done();
        });
    });

    it('should confirm project exists optimally', function testFastProjectExists(done) {
      request(app.proxy)
        .head('/api/projects/fast/project/'+ projectId0 + '?owner=' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          var latestVersion = res.get('Latest-Version');
          assert.equal(latestVersion, 0);
          var latestVersionUUID = res.get('Latest-Version-UUID');
          assert.equal(latestVersionUUID, projectUUID0);
          var retrievedOwner = res.get('Owner');
          assert.equal(owner, retrievedOwner);
          done();
        });
    });

    it('should fetch the latest project version by \'id\'', function fetchLatestProjectVersion(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          assert.equal(res.body.version, 0);
          done();
        });
    });

    it('should return a valid project for the correct owner', function fetchWithOwner(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0 + '?owner=' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          done();
        });
    });

    it('should not return a valid project for the wrong owner', function fetchWithBadOwner(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0 + '?owner=fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca')
        .expect(404)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          done();
        });
    });

    it('should create a new version with update of the project', function updateLatestVersion(done) {
      var data = {
        chicago: 'blackhawks',
        championships: 6,
      };

      request(app.proxy)
        .post('/api/projects/' + projectId0)
        .send({
          data: data,
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('update result:', res.body);
          assert.deepEqual(res.body.data, data);
          assert.equal(res.body.version, 1);
          done();
        });
    });

    it('should confirm project exists with \`Lastest-Version\` and \`Owner\` in headers', function testProjectExistsWithVersion(done) {
      request(app.proxy)
      // .head('/api/projects/'+ projectId0 + '?owner=' + owner)
        .head('/api/projects/'+ projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          var latestVersion = res.get('Latest-Version');
          assert.equal(latestVersion, 1);
          var retrievedOwner = res.get('Owner');
          assert.equal(owner, retrievedOwner);
          done();
        });
    });

    it('should update a specific project with owner, id, and version', function updateSpecific(done) {
      var data = {
        chicago: 'blackhawks',
        championships: 6,
        biggestFan: 'DEH',
      };

      request(app.proxy)
        .post('/api/projects/' + projectId0 + '?owner=' + owner + '&version=0')
        .send({
          data: data,
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('update result:', res.body);
          assert.deepEqual(res.body.data, data);
          done();
        });
    });

    it('should fetch the latest project version by \'id\'', function fetchLatestProjectVersion(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          assert.equal(res.body.version, 1);
          done();
        });
    });

    it('should fetch the previous project version', function fetchVersion(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0 + '?version=0')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          assert.equal(res.body.version, 0);
          done();
        });
    });

    it('should fetch latest project optimally', function optimizedFetchLatestProjectVersion(done) {
      request(app.proxy)
        .get('/api/projects/fast/project/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          assert.equal(res.body.version, 1);
          done();
        });
    });

    it('should fetch projects by \'ownerId\' (one project, two version)', function fetchProjectsByOwnerId(done) {
      request(app.proxy)
        .get('/api/projects/owner/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by owner result:', res.body);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, 1);
          assert.equal(res.body[0].version, 1);
          done();
        });
    });

    it('should find a project that contains a blockId', function testGetByBlockId(done) {
      var project = {
        "id": "project-364d0c6a-6f08-4fff-a292-425ca3eb91cc",
        "parents": [],
        "metadata": {
          "name": "EGF Sample Templates",
          "description": "This project includes a set of templates - combinatorial constructs with biological function - which can be fabricated at the Edinburgh Genome Foundry. This sample project is locked. To use the templates, drag them from the inventory list on the left, into one of your own projects.",
          "authors": [
            "11111111-1111-1111-9111-111111111111"
          ],
          "created": 1477335218195,
          "tags": {}
        },
        "components": [
          "block-0c0f7b43-7f1f-4b6b-a34e-f8a3cf78f5ab",
          "block-9918e893-9211-4b18-9c3e-3a7d63bc5186",
          "block-575e9425-a857-415d-9bd4-f15c2f128a1e",
          "block-e42053ff-0b34-45d8-a466-b771227372d2",
          "block-5a073ec0-424c-48c6-a114-503dba024ff8",
          "block-3a500271-3d10-4335-a910-0c4a29f2f075",
          "block-696d0861-c543-4bb8-b8c0-3786ae62e76d",
          "block-59aa6701-1ca6-4533-8755-bd60d71c9968",
          "block-eaf1fe6b-df94-451d-a6e5-7feaa0ae31a1",
          "block-f06a07be-a2fa-429e-b369-d00ee5a560f1",
          "block-d8a726cd-bd92-430d-99e4-cfa93909e3c6",
          "block-3fe9e68d-8d86-4a59-802b-16803d00cf9c",
          "block-2eae30ba-96de-4573-900c-cdd2bb7fb548",
          "block-5654de79-0194-4aa6-bd71-d8e759f9d262",
          "block-3f1eaa30-2f5f-4871-b9a8-4fc13b5cac9c",
          "block-e6275880-6997-4f6d-878d-aadd3fa9157f",
          "block-ab025abd-e2f8-4208-ad38-64efefde6762",
          "block-0dbc139b-fb86-4bff-a8e6-d130d0307a41",
          "block-1f928dae-6ed0-4132-883d-26f89da3e627",
          "block-2484f7f5-999c-4fba-86ed-46719f7fd784",
          "block-ed7ce4f5-afb6-4385-81fc-b482f45fd3c4",
          "block-a73e921b-68e2-4fe5-9c84-2869ac65cf78",
          "block-64638482-c233-4859-9068-c2a7af9fea82",
          "block-d33b2715-de94-4326-bf2f-2345742dcf17",
          "block-d49b854e-4da7-4138-bfb7-2d1a2ad8dc77",
          "block-b6718596-1a84-481f-aa92-901e02fa27d6",
          "block-7d3bfa9d-2409-4efc-ab65-1fb8d86c892f",
          "block-457af5b9-ab52-4552-8a77-47bf3dc22093",
          "block-1c7c8600-0b6e-4fc9-80f0-e11d655e25d7"
        ],
        "settings": {},
      };

      async.series([
        function (cb) {
          request(app.proxy)
            .post('/api/projects/')
            .send({
              owner: owner,
              id: projectId1,
              data: {
                project: project,
              },
            })
            .expect(200)
            .end(function (err, res) {
              cb(err, res.body);
            });
        },
        function (cb) {
          request(app.proxy)
            .get('/api/projects/block/' + 'block-0c0f7b43-7f1f-4b6b-a34e-f8a3cf78f5ab')
            .expect(200)
            .end(function (err, res) {
              cb(err, res.body);
            });
        },
      ], function (err, results) {
        assert.ifError(err);
        assert.equal(results.length, 2);
        assert.equal(results[1].length, 1);
        assert.deepEqual(results[0], results[1][0]);
        projectUUID1 = results[0].uuid;
        assert.notEqual(projectUUID1, null);
        assert.notEqual(projectUUID1, "");
        return done();
      });
    });

    it('should check existence of projects for an owner', function checkProjects(done) {
      request(app.proxy)
        .head('/api/projects/owner/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          var latestProject = res.get('Last-Project');
          assert.equal(latestProject, "project-364d0c6a-6f08-4fff-a292-425ca3eb91cc");
          var latestProjectUUID = res.get('Last-Project-UUID');
          assert.equal(latestProjectUUID, projectUUID1);
          done();
        });
    });

    it('should fetch a project by \'uuid\'', function testFetchByUUID(done) {
      request(app.proxy)
        .get('/api/projects/uuid/' + projectUUID1)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(res.body.uuid, projectUUID1);
          done();
        })
    });

    it('should fetch projects by \'ownerId\' (two projects, one w/ 2 versions)', function fetchProjectsByOwnerId(done) {
      request(app.proxy)
        .get('/api/projects/owner/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by owner result:', res.body);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, 2);
          each(res.body, function (project) {
            if (project.id === projectId0) {
              assert.equal(project.version, 1);
            } else if (project.id === projectId1) {
              assert.equal(project.version, 0);
            }
          });
          done();
        });
    });

    it('should fetch multiple versions of a project', function fetchProjectVersions(done) {
      request(app.proxy)
        .get('/api/projects/versions/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, 2);
          each(res.body, function (project) {
            assert.equal(project.id, projectId0);
            assert.equal(project.owner, owner);
            assert.notEqual(project.createdAt, null);
            assert.notEqual(project.updatedAt, null);
            assert.notEqual(project.version, null);
            assert.notEqual(project.status, null);
          });
          done();
        });
    });

    it('should get 404 for when no versions exist for a project', function fetchProjectNoVersions(done) {
      request(app.proxy)
        .get('/api/projects/versions/blah')
        .expect(404)
        .end(function (err) {
          assert.ifError(err);
          done();
        });
    });

    it('should delete a version of a project', function deleteProjectVersion(done ) {
      async.waterfall([
        function (cb) {
          var data = {
            chicago: 'blackhawks',
            championships: 6,
            biggestFan: 'DEH',
            snafu: true,
          };
          request(app.proxy)
            .post('/api/projects/' + projectId0 + '?owner=' + owner)
            .send({
              data: data,
            })
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body.version, null);
              assert(res.body.version > 0);
              return cb(err, res.body.version)
            });
        },
        function (version, cb) {
          request(app.proxy)
            .delete('/api/projects/' + projectId0 + '?version=' + version)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.projects, 1);
              return cb(err, version);
            });
        },
        function (version, cb) {
          request(app.proxy)
            .get('/api/projects/' + projectId0 + '?owner=' + owner + '&version=' + version)
            .expect(404)
            .end(function (err) {
              assert.ifError(err);
              return cb(err, version);
            });
        },
        function (version, cb) {
          request(app.proxy)
            .get('/api/projects/' + projectId0 + '?owner=' + owner)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body.version, null);
              assert.equal(res.body.version, version - 1);
              return cb(err);
            });
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should delete a project with id', function deleteById(done) {
      request(app.proxy)
        .delete('/api/projects/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log(res.body);
          assert.equal(res.body.projects, 2);
          assert.equal(res.body.snapshots, 0);
          assert.equal(res.body.orders, 0);
          return request(app.proxy)
            .get('/api/projects/' + projectId0)
            .expect(404)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.message, 'projectId ' + projectId0 + ' does not exist');
              done();
            });
        });
    });

    it('should fetch one project by \'ownerId\' (two projects, one deleted)', function fetchProjectsByOwnerId(done) {
      request(app.proxy)
        .get('/api/projects/owner/' + owner)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by owner result:', res.body);
          assert(Array.isArray(res.body));
          assert.equal(res.body.length, 1);
          assert.equal(res.body[0].version, 0);
          assert.equal(res.body[0].id, projectId1);
          done();
        });
    });

    it('should cascade delete to snapshots', function deleteByIDCascadeSnapshot(done) {
      async.waterfall([
        function (cb) {
          request(app.proxy)
            .post('/api/snapshots')
            .send({
              owner: owner,
              projectId: projectId1,
              projectVersion: 0,
              message: "test snapshot for cascading delete test",
              type: "test",
              tags: {
                test: true,
                chicago: "cubs",
              },
            })
            .expect(200)
            .end(function (err, res) {
              return cb(err, res.body.uuid);
            });
        },
        function (snapshotUUID, cb) {
          request(app.proxy)
            .post('/api/orders')
            .send({
              owner: owner,
              id: orderId0,
              projectId: projectId1,
              projectVersion: 0,
              type: "test",
              data: {
                foundry: "egf",
                status: "open",
                parts: ["foo", "snack", "driver"],
                dueDate: new Date(),
              },
            })
            .expect(200)
            .end(function (err, res) {
              return cb(err, {
                snapshotUUID: snapshotUUID,
                orderUUID: res.body.uuid,
              });
            });
        },
        function (uuids, cb) {
          request(app.proxy)
            .delete('/api/projects/' + projectId1)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.projects, 1);
              assert.equal(res.body.snapshots, 1);
              assert.equal(res.body.orders, 1);
              return cb(err, uuids);
            });
        },
      ], function (err, result) {
        assert.ifError(err);
        return async.parallel([
          function (cb) {
            request(app.proxy)
              .get('/api/snapshots/uuid/' + result.snapshotUUID)
              .expect(404)
              .end(cb);
          },
          function (cb) {
            request(app.proxy)
              .get('/api/orders/uuid/' + result.orderUUID)
              .expect(404)
              .end(cb);
          },
        ], function (err) {
          assert.ifError(err);
          done();
        });
      });
    });

    it('should save a new project with specified version', function saveNewProject(done) {

      var data = {
        chicago: 'blackhawks',
        versioned: true,
      };

      request(app.proxy)
        .post('/api/projects')
        .send({
          owner: owner,
          id: projectId2,
          data: data,
          version: 47
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('save res:', res.body);
          assert.notEqual(res.body.uuid, null);
          projectUUID0 = res.body.uuid;
          assert.equal(res.body.owner, owner);
          assert.equal(res.body.version, 47);
          assert.equal(res.body.status, 1);
          assert.equal(res.body.id, projectId2);
          assert.deepEqual(res.body.data, data);
          assert.notEqual(res.body.createdAt, null);
          assert.notEqual(res.body.updatedAt, null);
          done();
        });
    });
  });
});
