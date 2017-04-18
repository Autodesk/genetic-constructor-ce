"use strict";

var assert = require('assert');
var util = require('../lib/util');

describe('util', function () {
  it('notNullOrEmpty', function () {
    assert.equal(util.notNullOrEmpty('foo'), true);
    assert.equal(util.notNullOrEmpty(7), false);
    assert.equal(util.notNullOrEmpty(''), false);
    assert.equal(util.notNullOrEmpty(null), false);
    assert.equal(util.notNullOrEmpty(undefined), false);
  });

  it('notNullAndPosInt', function () {
    assert.equal(util.notNullAndPosInt(7), true);
    assert.equal(util.notNullAndPosInt(0), true);
    assert.equal(util.notNullAndPosInt(-1), false);
    assert.equal(util.notNullAndPosInt('7'), false);
    assert.equal(util.notNullAndPosInt(null), false);
    assert.equal(util.notNullAndPosInt(undefined), false);
  });
});