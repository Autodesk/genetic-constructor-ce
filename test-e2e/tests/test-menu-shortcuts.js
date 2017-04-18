var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');

module.exports = {
  'Test menu shortcuts' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);

    browser
      .keys([browser.Keys.COMMAND, 'a'])
      .pause(1000)
      .assert.countelements(".scenegraph-userinterface-selection", 6)
      // cut all selected blocks
      .keys([browser.Keys.NULL, browser.Keys.COMMAND, 'x'])
      .pause(1000)
      // expect all selections and blocks to be removed
      .assert.countelements(".scenegraph-userinterface-selection", 0)
      .assert.countelements('[data-nodetype="block"]', 0)
      .end();
  }
};
