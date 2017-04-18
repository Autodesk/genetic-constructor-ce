"use strict";

var assert = require("assert");
var async = require("async");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var each = require('underscore').each;
var keys = require('underscore').keys;
var pick = require('underscore').pick;

var Project = require('../../../../lib/project');
var Order = require('../../../../lib/order');

var owner = '810ffb30-1938-11e6-a132-dd99bc746802';

describeAppTest("http", function (app) {
  describe('api order routes', function () {
    this.timeout(15000);

    var projectId = 'project-fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca';

    var orderId0 = 'fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca';
    var orderId1 = 'fe5b5340-8971-11e6-b86a-b5fa2a5eb9ca';
    var orderId2 = 'fe5b5340-8931-11e6-b86a-b5fa2a5eb9ca';

    var projectUUID0 = null;
    var projectUUID1 = null;

    var orderUUID0 = null;
    var orderUUID1 = null;
    var orderUUID2 = null;

    before(function (done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .post('/api/projects')
            .send({
              owner: owner,
              id: projectId,
              data: {
                foo: "bar",
                yes: "no",
                counts: {
                  "1": 10,
                  "2": 47,
                },
              },
            })
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body.uuid, null);
              projectUUID0 = res.body.uuid;
              return cb(err);
            });
        },
        function (cb) {
          request(app.proxy)
            .post('/api/projects/' + projectId)
            .send({
              data: {
                foo: "bar",
                yes: "no",
                counts: {
                  "1": 10,
                  "2": 47,
                  "3": 578,
                },
                what: "happened",
              },
            })
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.notEqual(res.body.uuid, projectUUID0);
              assert.equal(res.body.version, 1);
              return cb(err);
            });
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    after(function (done) {
      async.series([
        function (cb) {
          Order.destroy({
            where: {
              owner: owner,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' orders');
            cb();
          }).catch(function (err) {
            console.error('order cleanup error', err);
            cb(err);
          });
        },
        function (cb) {
          Project.destroy({
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
        assert.ifError(err);
        done();
      });
    });

    it('should create an order', function createOrder(done) {
      var orderData = {
        owner: owner,
        id: orderId0,
        projectId: projectId,
        projectVersion: 0,
        type: "test",
        data: {
          test: true,
          hello: "kitty",
          stuff: ["bing", "bang", "bong"],
          worldSeries: "cubs",
        },
      };

      request(app.proxy)
        .post('/api/orders')
        .send(orderData)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.notEqual(res.body.uuid, null);
          orderUUID0 = res.body.uuid;
          // console.log(res.body);
          assert.deepEqual(pick(res.body, keys(orderData)), orderData);
          assert.notEqual(res.body.projectUUID, null);
          assert.notEqual(res.body.createdAt, null);
          assert.notEqual(res.body.updatedAt, null);
          done();
        });
    });

    it('should check if order exists for an id', function checkById(done) {
      request(app.proxy)
        .head('/api/orders/id/' + orderId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          var uuidHeader = res.get('Order-UUID');
          assert.equal(uuidHeader, orderUUID0);
          done();
        });
    });

    it('should check if order exists for an id and owner', function checkById(done) {
      request(app.proxy)
        .head('/api/orders/id/' + orderId0 + '?owner=fe5b5340-8971-11e6-b86a-b5fa2a5eb9ca')
        .expect(404)
        .end(function (err) {
          assert.ifError(err);
          done();
        });
    });

    it('should create an order with most recent version', function createOrderMostRecent(done) {
      var orderData = {
        owner: owner,
        id: orderId1,
        projectId: projectId,
        type: "test",
        data: {
          test: true,
          hello: "kitty",
          stuff: ["bing", "bang", "bong"],
          worldSeries: "cubs",
          version: "latest",
        },
      };

      request(app.proxy)
        .post('/api/orders')
        .send(orderData)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.notEqual(res.body.uuid, null);
          assert.notEqual(res.body.uuid, orderUUID0);
          orderUUID1 = res.body.uuid;
          // console.log(res.body);
          assert.deepEqual(pick(res.body, keys(orderData)), orderData);
          assert.equal(res.body.projectVersion, 1);
          assert.notEqual(res.body.projectUUID, null);
          assert.notEqual(res.body.createdAt, null);
          assert.notEqual(res.body.updatedAt, null);
          done();
        });
    });

    it('should fetch an order using UUID', function fetchByUUID(done) {
      request(app.proxy)
        .get('/api/orders/uuid/' + orderUUID0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(res.body.uuid, orderUUID0);
          assert.equal(res.body.id, orderId0);
          assert.notEqual(res.body.projectUUID, null);
          assert.notEqual(res.body.updatedAt, null);
          assert.notEqual(res.body.createdAt, null);
          assert.equal(res.body.type, "test");
          assert.notEqual(res.body.data, null);
          assert.equal(res.body.projectId, projectId);
          assert.notEqual(res.body.projectVersion, null);
          done();
        });
    });

    it('should fetch an order using id', function fetchByUUID(done) {
      request(app.proxy)
        .get('/api/orders/id/' + orderId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(res.body.uuid, orderUUID0);
          assert.notEqual(res.body.projectUUID, null);
          assert.notEqual(res.body.updatedAt, null);
          assert.notEqual(res.body.createdAt, null);
          assert.equal(res.body.type, "test");
          assert.notEqual(res.body.data, null);
          assert.equal(res.body.projectId, projectId);
          assert.notEqual(res.body.projectVersion, null);
          done();
        });
    });

    it('should update order for the same version', function updateSameVersion(done) {
      var orderData = {
        owner: owner,
        id: orderId0,
        projectId: projectId,
        projectVersion: 0,
        type: "order",
        data: {
          test: true,
          hello: "kitty",
          stuff: ["bing", "bang", "bong", "BOOM"],
          worldSeries: "cubs",
          fuzzy: "dice",
        },
      };

      request(app.proxy)
        .post('/api/orders')
        .send(orderData)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(res.body.uuid, orderUUID0);
          // console.log(res.body);
          assert.equal(res.body.type, "order");
          assert.deepEqual(res.body.data, orderData.data);
          done();
        });
    });

    it('should create a new order for new version of same project', function createNewVersion(done) {
      async.waterfall([
        function (cb) {
          var newProjectData = {
            foo: "bar",
            yes: "no",
            counts: {
              "1": 10,
              "2": 47,
            },
          };

          request(app.proxy)
            .post('/api/projects/' + projectId)
            .send({
              data: newProjectData,
            })
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              // console.log('update result:', res.body);
              assert.deepEqual(res.body.data, newProjectData);
              assert(res.body.version > 0);
              cb(null, res.body.version);
            });
        },
        function (newVersion, cb) {
          var newOrderData = {
            owner: owner,
            id: orderId2,
            projectId: projectId,
            projectVersion: newVersion,
            type: "test",
            data: {
              test: true,
              hello: "kitty",
              stuff: ["ying", "yang"],
            },
          };

          request(app.proxy)
            .post('/api/orders')
            .send(newOrderData)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.id, orderId2);
              assert.notEqual(res.body.uuid, null);
              orderUUID2 = res.body.uuid;
              // console.log(res.body);
              assert.deepEqual(pick(res.body, keys(newOrderData)), newOrderData);
              assert.notEqual(res.body.projectUUID, null);
              assert.notEqual(res.body.createdAt, null);
              assert.notEqual(res.body.updatedAt, null);
              cb(null, null);
            });
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should return 404 for fetch of non-existing order', function fetchNotExist(done) {
      request(app.proxy)
        .get('/api/orders/blah')
        .expect(404)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.notEqual(res.body.message, null);
          done();
        });
    });

    it('should fetch all orders for a project', function fetchAllOrders(done) {
      request(app.proxy)
        .get('/api/orders/' + projectId)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert(Array.isArray(res.body));
          var orders = res.body;
          assert.equal(orders.length, 3);
          each(orders, function (order) {
            assert.notEqual(order.projectUUID, null);
            assert.notEqual(order.updatedAt, null);
            assert.notEqual(order.createdAt, null);
            assert.notEqual(order.type, null);
            assert.notEqual(order.data, null);
            assert.equal(order.projectId, projectId);
            assert.notEqual(order.projectVersion, null);
          });
          done();
        });
    });

    it('should fetch one order for one project version', function fetchOneOrder(done) {
      request(app.proxy)
        .get('/api/orders/' + projectId + '?version=0')
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert(Array.isArray(res.body));
          var orders = res.body;
          assert.equal(orders.length, 1);
          var order = orders[0];
          assert.notEqual(order.projectUUID, null);
          assert.notEqual(order.updatedAt, null);
          assert.notEqual(order.createdAt, null);
          assert.equal(order.type, "order");
          assert.notEqual(order.data, null);
          assert.equal(order.projectId, projectId);
          assert.equal(order.projectVersion, 0);
          done();
        });
    });

    it('should return 404 for existence check for non-existing project', function testOrderExistsFail(done) {
      request(app.proxy)
        .head('/api/orders/aaaabbbba')
        .expect(404)
        .end(function (err, res) {
          assert.ifError(err);
          done();
        });
    });

    it('should check exists of orders for a project', function testOrdersExist(done) {
      async.waterfall([
        function (cb) {
          request(app.proxy)
            .head('/api/orders/' + projectId)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              var latestOrderId = res.get('Latest-Order-Id');
              assert.notEqual(latestOrderId, null);
              var latestOrderUUID = res.get('Latest-Order-UUID');
              assert.notEqual(latestOrderUUID, null);
              cb(err, {
                uuid: latestOrderUUID,
                id: latestOrderId,
              });
            });
        },
        function (latestOrder, cb) {
          request(app.proxy)
            .get('/api/orders/uuid/' + latestOrder.uuid)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.uuid, latestOrder.uuid);
              assert.equal(res.body.id, latestOrder.id);
              assert.notEqual(res.body.projectUUID, null);
              assert.notEqual(res.body.updatedAt, null);
              assert.notEqual(res.body.createdAt, null);
              assert.equal(res.body.type, "test");
              assert.notEqual(res.body.data, null);
              assert.equal(res.body.projectId, projectId);
              assert.notEqual(res.body.projectVersion, null);
              cb(err, latestOrder);
            });
        },
        function (latestOrder, cb) {
          request(app.proxy)
            .get('/api/orders/id/' + latestOrder.id)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.uuid, latestOrder.uuid);
              assert.equal(res.body.id, latestOrder.id);
              assert.notEqual(res.body.projectUUID, null);
              assert.notEqual(res.body.updatedAt, null);
              assert.notEqual(res.body.createdAt, null);
              assert.equal(res.body.type, "test");
              assert.notEqual(res.body.data, null);
              assert.equal(res.body.projectId, projectId);
              assert.notEqual(res.body.projectVersion, null);
              cb(err, latestOrder);
            });
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should delete an order by UUID', function deleteByUUID(done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .delete('/api/orders/uuid/' + orderUUID0)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.numDeleted, 1);
              cb(err);
            });
        },
        function (cb) {
          request(app.proxy)
            .get('/api/orders/uuid/' + orderUUID0)
            .expect(404)
            .end(function (err, res) {
              assert.ifError(err);
              cb(err);
            });
        },
        function (cb) {
          Order.findOne({
            where: {
              uuid: orderUUID0,
            }
          }).then(function (result) {
            assert.notEqual(result, null);
            assert.equal(result.get('status'), 0);
            cb(null);
          }).catch(cb);
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should destroy an order by UUID', function destroyByUUID(done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .delete('/api/orders/uuid/' + orderUUID2 + '?destroy=true')
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.numDeleted, 1);
              cb(err);
            });
        },
        function (cb) {
          request(app.proxy)
            .get('/api/orders/uuid/' + orderUUID2)
            .expect(404)
            .end(function (err, res) {
              assert.ifError(err);
              cb(err);
            });
        },
        function (cb) {
          Order.findOne({
            where: {
              uuid: orderUUID2,
            }
          }).then(function (result) {
            assert.equal(result, null);
            cb(null);
          }).catch(cb);
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should delete an order by id', function deleteByOrderId(done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .delete('/api/orders/id/' + orderId1)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.numDeleted, 1);
              cb(err);
            });
        },
        function (cb) {
          request(app.proxy)
            .get('/api/orders/id/' + orderId1)
            .expect(404)
            .end(function (err, res) {
              assert.ifError(err);
              cb(err);
            });
        },
        function (cb) {
          Order.findOne({
            where: {
              id: orderId1,
              owner: owner,
            }
          }).then(function (result) {
            assert.notEqual(result, null);
            assert.equal(result.get('status'), 0);
            cb(null);
          }).catch(cb);
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should destroy an order by id and owner', function destroyByOrderId(done) {
      async.series([
        function (cb) {
          request(app.proxy)
            .delete('/api/orders/id/' + orderId1 + '?destroy=true' + '&owner=' + owner)
            .expect(200)
            .end(function (err, res) {
              assert.ifError(err);
              assert.notEqual(res, null);
              assert.notEqual(res.body, null);
              assert.equal(res.body.numDeleted, 1);
              cb(err);
            });
        },
        function (cb) {
          Order.findOne({
            where: {
              id: orderId1,
              owner: owner,
            }
          }).then(function (result) {
            assert.equal(result, null);
            cb(null);
          }).catch(cb);
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });
  });
});
