var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var size = require('../fixtures/size');
module.exports = {
  'Test that when creating a new project we get a new focused construct' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    newProject(browser);

    browser
      .pause(1000)
      // expect one focused construct viewer
      .assert.countelements(".construct-viewer", 1)
      // the dark style is only present for unfocused constructs so don't expect it
      .waitForElementNotPresent('.sceneGraph-dark', 5000, 'expected construct to be focused')
      .end();
  }
};
